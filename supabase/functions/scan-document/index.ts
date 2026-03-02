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

    // Handle base64 PDF: extract text using a simpler approach
    let textContent = fileContent;
    if (fileContent.startsWith("[BASE64_PDF]")) {
      const base64Data = fileContent.replace("[BASE64_PDF]", "");
      // Decode base64 to binary
      const binaryStr = atob(base64Data);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      // Extract readable text from PDF binary
      const decoder = new TextDecoder("utf-8", { fatal: false });
      const rawText = decoder.decode(bytes);
      
      // Extract text between PDF stream markers and parentheses (PDF text objects)
      const textParts: string[] = [];
      
      // Method 1: Extract text from PDF text objects (Tj and TJ operators)
      const tjMatches = rawText.matchAll(/\(([^)]*)\)\s*Tj/g);
      for (const m of tjMatches) {
        textParts.push(m[1]);
      }
      
      // Method 2: Extract from BT...ET text blocks
      const btBlocks = rawText.matchAll(/BT\s*([\s\S]*?)\s*ET/g);
      for (const block of btBlocks) {
        const innerText = block[1].matchAll(/\(([^)]*)\)/g);
        for (const t of innerText) {
          if (t[1].length > 1) textParts.push(t[1]);
        }
      }
      
      // Method 3: Fallback - extract any printable text sequences
      if (textParts.length === 0) {
        const printable = rawText.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s{3,}/g, " ");
        // Find date-like patterns and their surrounding context
        const dateContexts = printable.matchAll(/(.{0,50}(?:\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{2,4}).{0,50})/gi;
        for (const dc of dateContexts) {
          textParts.push(dc[0].trim());
        }
        // Also include general readable text
        if (textParts.length === 0) {
          textParts.push(printable.trim());
        }
      }
      
      textContent = textParts.join(" ").trim();
      
      if (textContent.length < 10) {
        // Last resort: send the raw printable text
        textContent = rawText.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s{3,}/g, " ").trim();
      }
    }

    // Truncate if very long
    if (textContent.length > 15000) {
      textContent = textContent.substring(0, 15000);
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
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert at reading document contents and extracting calendar events. 

IMPORTANT: Ignore the document filename entirely. Focus ONLY on reading the actual text content of the document to find events, appointments, deadlines, meetings, or any activities with specific dates and times.

CRITICAL DATE PARSING RULES:
- Dates may be in ANY format: DD/MM/YYYY, DD-MM-YYYY, "18th April 2026", "March 3, 2026", "3rd Mar 2026", etc.
- UK date format (DD/MM/YYYY) is the DEFAULT. So 18/09/2026 means 18th September 2026, NOT September 18th.
- Always convert dates to ISO format in your output.
- Look carefully for ALL dates in the text, even if they appear within sentences or paragraphs.

Return a JSON array of detected events. Each event must have:
- title (string, clear descriptive name of the event based on document content)
- detected_date (ISO datetime string, e.g. "2026-09-18T00:00:00". If only a date is found with no time, use T00:00:00)
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
- Return ONLY a valid JSON array, no markdown, no explanation
- If text seems garbled or partial, still try to find any dates and associated context`,
          },
          {
            role: "user",
            content: `Document filename: ${fileName}\n\nRead the following document content carefully and extract ALL events, appointments, and dates:\n\n${textContent}`,
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
