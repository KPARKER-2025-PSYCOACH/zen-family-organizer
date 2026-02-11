import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { cuisine, difficulty, query, dietaryRequirements, offset } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const dietaryText =
      dietaryRequirements && dietaryRequirements.length > 0
        ? `The recipes MUST be suitable for these dietary requirements: ${dietaryRequirements.join(", ")}.`
        : "";

    const cuisineText =
      cuisine && cuisine !== "any" ? `Cuisine: ${cuisine}.` : "";

    const difficultyText =
      difficulty && difficulty !== "any" ? `Difficulty level: ${difficulty}.` : "";

    const queryText = query ? `Special request: ${query}.` : "";

    const offsetText =
      offset && offset > 0
        ? `This is page ${offset / 10 + 1}. Return DIFFERENT recipes than what a user might have already seen. Be creative and varied.`
        : "";

    const systemPrompt = `You are a helpful family meal planning assistant. Return exactly 10 recipe suggestions as a JSON array. Each recipe must have these fields:
- id (unique string)
- title (string)
- description (short string, max 100 chars)
- cuisine (one of: italian, chinese, indian, mexican, japanese, thai, mediterranean, french, american, korean, vietnamese, greek, spanish, middle_eastern, british)
- difficulty (one of: easy, medium, hard)
- prepTime (number, minutes)
- cookTime (number, minutes)
- servings (number)
- ingredients (array of objects with item, amount, unit)
- instructions (array of step strings)

Return ONLY a valid JSON array, no markdown, no explanation.`;

    const userPrompt = `Suggest 10 family-friendly recipes. ${dietaryText} ${cuisineText} ${difficultyText} ${queryText} ${offsetText}`.trim();

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Failed to get recipe suggestions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "[]";

    // Strip markdown code fences if present
    content = content.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

    let recipes;
    try {
      recipes = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(
        JSON.stringify({ error: "Failed to parse recipe suggestions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ recipes }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("meal-search error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
