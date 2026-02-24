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
    // Handle GET request - this is the OAuth callback from Google
    if (req.method === "GET") {
      const url = new URL(req.url);
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const error = url.searchParams.get("error");

      if (error) {
        // Redirect back to the app settings page with error
        return new Response(null, {
          status: 302,
          headers: { "Location": `${Deno.env.get("APP_URL") || "https://zen-family-organizer.lovable.app"}/settings?oauth_error=${encodeURIComponent(error)}` },
        });
      }

      if (code && state) {
        // Redirect back to the app with code and state as query params
        const appUrl = Deno.env.get("APP_URL") || "https://zen-family-organizer.lovable.app";
        const redirectUrl = `${appUrl}/settings?oauth_code=${encodeURIComponent(code)}&oauth_state=${encodeURIComponent(state)}`;
        return new Response(null, {
          status: 302,
          headers: { "Location": redirectUrl },
        });
      }

      return new Response("Invalid OAuth callback", { status: 400 });
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
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

    const { action, code, connectionType } = await req.json();
    const clientId = Deno.env.get("OAuth_Client_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;

    if (!clientId || !clientSecret) {
      return new Response(JSON.stringify({ error: "Google OAuth not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_auth_url") {
      // connectionType can be "calendar", "email", or "both"
      const scopes = [];
      if (connectionType === "calendar" || connectionType === "both") {
        scopes.push("https://www.googleapis.com/auth/calendar.readonly");
      }
      if (connectionType === "email" || connectionType === "both") {
        scopes.push("https://www.googleapis.com/auth/gmail.readonly");
      }
      scopes.push("https://www.googleapis.com/auth/userinfo.email");

      // Use the edge function itself as redirect URI
      const redirectUri = `${supabaseUrl}/functions/v1/google-calendar-auth`;
      
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: scopes.join(" "),
        access_type: "offline",
        prompt: "consent",
        state: JSON.stringify({ userId: user.id, connectionType }),
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      
      return new Response(JSON.stringify({ authUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "exchange_code") {
      const redirectUri = `${supabaseUrl}/functions/v1/google-calendar-auth`;
      
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        const err = await tokenResponse.text();
        console.error("Token exchange failed:", err);
        return new Response(JSON.stringify({ error: "Failed to exchange code" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tokens = await tokenResponse.json();

      // Get user email
      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const userInfo = await userInfoRes.json();

      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

      // Save calendar connection if requested
      if (connectionType === "calendar" || connectionType === "both") {
        const { error: calError } = await serviceClient
          .from("calendar_connections")
          .upsert({
            user_id: user.id,
            provider: "google",
            email: userInfo.email,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            token_expires_at: expiresAt,
            connected: true,
          }, { onConflict: "user_id,provider", ignoreDuplicates: false });

        if (calError) console.error("Calendar connection error:", calError);
      }

      // Save email connection if requested
      if (connectionType === "email" || connectionType === "both") {
        const { error: emailError } = await serviceClient
          .from("email_connections")
          .upsert({
            user_id: user.id,
            provider: "gmail",
            email: userInfo.email,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            token_expires_at: expiresAt,
            connected: true,
          }, { onConflict: "user_id,provider", ignoreDuplicates: false });

        if (emailError) console.error("Email connection error:", emailError);
      }

      return new Response(JSON.stringify({ success: true, email: userInfo.email }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("google-calendar-auth error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
