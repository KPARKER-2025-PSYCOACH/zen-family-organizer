import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const { fileName, fileContent } = await req.json();

    if (!fileContent) {
      return new Response(JSON.stringify({ error: "No file content provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use AI to extract dates/events from document text
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert at reading document contents and extracting calendar events. 

IMPORTANT: Ignore the document filename entirely. Focus ONLY on reading the actual text content of the document to find events, appointments, deadlines, meetings, or any activities with specific dates and times.

Return a JSON array of detected events. Each event must have:
- title (string, clear descriptive name of the event based on document content)
- detected_date (ISO datetime string, e.g. "2026-03-15T09:00:00". If only a date is found with no time, use T00:00:00)
- detected_end_date (ISO datetime string or null. If a duration or end time is mentioned, include it)
- confidence ("high" if date/time are explicit, "medium" if inferred from context, "low" if ambiguous)
- category ("school", "health", "travel", "birthday", "meal", "work", "personal", "other")
- suggest_gift (boolean, true only if it's a birthday or celebration)
- gift_reason (string or null, e.g. "Birthday party")
- description (brief context extracted from the document about this event)

Rules:
- Only include events with specific dates found in the document text
- Extract times when mentioned (e.g. "3pm", "15:00", "morning drop-off at 8:30")
- If a time range is given (e.g. "2-4pm"), set both detected_date and detected_end_date with correct times
- Return ONLY a valid JSON array, no markdown, no explanation`,
          },
          {
            role: "user",
            content: `Read the following document content carefully and extract all events, appointments, and dates with times:\n\n${fileContent}`,
          },
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

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Save detected events
    const eventsToInsert = detectedEvents.map((e: any) => ({
      user_id: user.id,
      source_type: "document",
      source_subject: fileName,
      source_from: null,
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

    return new Response(
      JSON.stringify({ success: true, count: eventsToInsert.length, events: detectedEvents }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("scan-document error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
