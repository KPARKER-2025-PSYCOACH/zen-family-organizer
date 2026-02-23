import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function refreshToken(connection: any, serviceClient: any): Promise<string> {
  const expiresAt = new Date(connection.token_expires_at);
  if (expiresAt > new Date(Date.now() + 5 * 60 * 1000)) {
    return connection.access_token;
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("OAuth_Client_ID")!,
      client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
      refresh_token: connection.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) throw new Error("Failed to refresh token");
  const tokens = await res.json();

  await serviceClient
    .from("email_connections")
    .update({
      access_token: tokens.access_token,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    })
    .eq("id", connection.id);

  return tokens.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get email connection
    const { data: connection } = await serviceClient
      .from("email_connections")
      .select("*")
      .eq("user_id", user.id)
      .eq("provider", "gmail")
      .eq("connected", true)
      .single();

    if (!connection) {
      return new Response(JSON.stringify({ error: "No Gmail connected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = await refreshToken(connection, serviceClient);

    // Fetch recent emails (last 30 days)
    const after = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
    const messagesRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=50&q=after:${after}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!messagesRes.ok) {
      console.error("Gmail list error:", await messagesRes.text());
      return new Response(JSON.stringify({ error: "Failed to fetch emails" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const messagesData = await messagesRes.json();
    const messageIds = (messagesData.messages || []).slice(0, 20);

    // Fetch email details
    const emails = [];
    for (const msg of messageIds) {
      const detailRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (detailRes.ok) {
        const detail = await detailRes.json();
        const headers = detail.payload?.headers || [];
        const subject = headers.find((h: any) => h.name === "Subject")?.value || "";
        const from = headers.find((h: any) => h.name === "From")?.value || "";
        const date = headers.find((h: any) => h.name === "Date")?.value || "";
        emails.push({ subject, from, date, snippet: detail.snippet || "" });
      }
    }

    // Use AI to extract dates/events from emails
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const emailSummaries = emails
      .map((e, i) => `Email ${i + 1}:\nFrom: ${e.from}\nSubject: ${e.subject}\nDate: ${e.date}\nSnippet: ${e.snippet}`)
      .join("\n\n");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You extract dates and events from emails. Return a JSON array of detected events. Each event:
- title (string, descriptive event name)
- detected_date (ISO date string)
- detected_end_date (ISO date string or null)
- source_subject (email subject)
- source_from (sender)
- confidence ("high", "medium", or "low")
- category ("school", "health", "travel", "birthday", "meal", "work", "personal", "other")
- suggest_gift (boolean, true if birthday/celebration)
- gift_reason (string or null)
- description (brief context)

Only include genuine events with specific dates. Return ONLY valid JSON array, no markdown.`,
          },
          { role: "user", content: `Extract events from these emails:\n\n${emailSummaries}` },
        ],
      }),
    });

    if (!aiRes.ok) {
      console.error("AI error:", await aiRes.text());
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    let content = aiData.choices?.[0]?.message?.content || "[]";
    content = content.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

    let detectedEvents;
    try {
      detectedEvents = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      detectedEvents = [];
    }

    // Save detected events
    const eventsToInsert = detectedEvents.map((e: any) => ({
      user_id: user.id,
      source_type: "email",
      source_subject: e.source_subject,
      source_from: e.source_from,
      detected_date: e.detected_date,
      detected_end_date: e.detected_end_date || null,
      title: e.title,
      description: e.description || null,
      confidence: e.confidence || "medium",
      category: e.category || "other",
      suggest_gift: e.suggest_gift || false,
      gift_reason: e.gift_reason || null,
      status: "pending",
    }));

    if (eventsToInsert.length > 0) {
      await serviceClient.from("detected_events").insert(eventsToInsert);
    }

    // Update last scanned
    await serviceClient
      .from("email_connections")
      .update({ last_scanned: new Date().toISOString() })
      .eq("id", connection.id);

    return new Response(
      JSON.stringify({ success: true, count: eventsToInsert.length, events: detectedEvents }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("scan-emails error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
