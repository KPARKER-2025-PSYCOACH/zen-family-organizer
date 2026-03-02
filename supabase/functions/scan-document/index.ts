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

    const { fileName, fileContent, isPdf } = await req.json();

    if (!fileContent) {
      return new Response(JSON.stringify({ error: "No file content provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are an expert at reading documents and extracting calendar events.

CRITICAL RULES:
- ONLY extract events that are EXPLICITLY written in the document with specific dates.
- DO NOT invent, guess, or hallucinate events. If a date has no associated event description, skip it.
- If the document contains no events with dates, return an empty array [].
- UK date format (DD/MM/YYYY) is the DEFAULT. So 18/09/2026 means 18th September 2026.
- Look for ALL date formats: DD/MM/YYYY, DD-MM-YYYY, "18th April 2026", "March 3, 2026", etc.

Return a JSON array of detected events. Each event must have:
- title (string - use the EXACT description from the document, do not paraphrase or invent)
- detected_date (ISO datetime string, e.g. "2026-09-18T00:00:00")
- detected_end_date (ISO datetime string or null)
- confidence ("high" if date/time are explicit, "medium" if inferred)
- category ("school", "health", "travel", "birthday", "meal", "work", "personal", "other")
- suggest_gift (boolean, true only for birthdays/celebrations)
- gift_reason (string or null)
- description (brief context QUOTED from the document)

Return ONLY a valid JSON array. No markdown, no explanation. If no events found, return [].`;

    // Build messages based on whether this is a PDF (use multimodal) or text
    let messages: any[];

    if (isPdf) {
      // Use Gemini multimodal: send PDF as inline_data so the model reads it directly
      messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Read this PDF document (filename: "${fileName}") and extract ONLY events with specific dates that are actually written in it. Do NOT make up events.`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:application/pdf;base64,${fileContent}`,
              },
            },
          ],
        },
      ];
    } else {
      // Plain text content
      let textContent = fileContent;
      if (textContent.length > 15000) {
        textContent = textContent.substring(0, 15000);
      }
      messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Document filename: ${fileName}\n\nExtract ONLY events with specific dates from this document. Do NOT invent events:\n\n${textContent}`,
        },
      ];
    }

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI error:", aiRes.status, errText);
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
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

    // Filter out any events without a valid date
    detectedEvents = detectedEvents.filter((e: any) => e.detected_date);

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

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
