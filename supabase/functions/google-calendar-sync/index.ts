import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function refreshTokenIfNeeded(
  connection: any,
  serviceClient: any
): Promise<string> {
  const expiresAt = new Date(connection.token_expires_at);
  if (expiresAt > new Date(Date.now() + 5 * 60 * 1000)) {
    return connection.access_token;
  }

  const clientId = Deno.env.get("OAuth_Client_ID")!;
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: connection.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) throw new Error("Failed to refresh token");
  const tokens = await res.json();

  await serviceClient
    .from("calendar_connections")
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

    // Get calendar connection
    const { data: connection } = await serviceClient
      .from("calendar_connections")
      .select("*")
      .eq("user_id", user.id)
      .eq("provider", "google")
      .eq("connected", true)
      .single();

    if (!connection) {
      return new Response(JSON.stringify({ error: "No Google Calendar connected" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = await refreshTokenIfNeeded(connection, serviceClient);

    // Fetch events from Google Calendar (next 3 months)
    const now = new Date();
    const threeMonthsLater = new Date(now);
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);

    const params = new URLSearchParams({
      timeMin: now.toISOString(),
      timeMax: threeMonthsLater.toISOString(),
      maxResults: "250",
      singleEvents: "true",
      orderBy: "startTime",
    });

    const calRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!calRes.ok) {
      const err = await calRes.text();
      console.error("Google Calendar API error:", err);
      return new Response(JSON.stringify({ error: "Failed to fetch calendar events" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const calData = await calRes.json();
    const googleEvents = calData.items || [];

    // Upsert events into our database
    const eventsToUpsert = googleEvents.map((event: any) => ({
      user_id: user.id,
      title: event.summary || "Untitled",
      description: event.description || null,
      start_time: event.start?.dateTime || event.start?.date,
      end_time: event.end?.dateTime || event.end?.date,
      all_day: !event.start?.dateTime,
      category: "other",
      source: "synced",
      google_event_id: event.id,
      calendar_connection_id: connection.id,
    }));

    // Delete old synced events and insert fresh
    await serviceClient
      .from("calendar_events")
      .delete()
      .eq("user_id", user.id)
      .eq("source", "synced")
      .eq("calendar_connection_id", connection.id);

    if (eventsToUpsert.length > 0) {
      const { error: insertError } = await serviceClient
        .from("calendar_events")
        .insert(eventsToUpsert);
      if (insertError) console.error("Insert events error:", insertError);
    }

    // Update last synced
    await serviceClient
      .from("calendar_connections")
      .update({ last_synced: new Date().toISOString() })
      .eq("id", connection.id);

    return new Response(
      JSON.stringify({ success: true, count: eventsToUpsert.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("google-calendar-sync error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
