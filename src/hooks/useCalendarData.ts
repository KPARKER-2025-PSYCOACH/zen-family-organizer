import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CalendarEventRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  all_day: boolean;
  category: string;
  source: string;
  google_event_id: string | null;
  calendar_connection_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DetectedEventRow {
  id: string;
  user_id: string;
  source_type: string;
  source_subject: string | null;
  source_from: string | null;
  detected_date: string;
  detected_end_date: string | null;
  title: string;
  description: string | null;
  confidence: string;
  category: string;
  status: string;
  suggest_gift: boolean;
  gift_reason: string | null;
  created_at: string;
}

export interface CalendarConnectionRow {
  id: string;
  user_id: string;
  provider: string;
  email: string | null;
  connected: boolean;
  last_synced: string | null;
  created_at: string;
}

export function useCalendarData() {
  const [events, setEvents] = useState<CalendarEventRow[]>([]);
  const [detectedEvents, setDetectedEvents] = useState<DetectedEventRow[]>([]);
  const [connections, setConnections] = useState<CalendarConnectionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchEvents = useCallback(async () => {
    const { data, error } = await supabase
      .from("calendar_events")
      .select("*")
      .order("start_time", { ascending: true });
    if (error) {
      console.error("Error fetching events:", error);
    } else {
      setEvents((data as any[]) || []);
    }
  }, []);

  const fetchConnections = useCallback(async () => {
    const { data, error } = await supabase
      .from("calendar_connections")
      .select("*");
    if (error) {
      console.error("Error fetching connections:", error);
    } else {
      setConnections((data as any[]) || []);
    }
  }, []);

  const fetchDetectedEvents = useCallback(async () => {
    const { data, error } = await supabase
      .from("detected_events")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching detected events:", error);
    } else {
      setDetectedEvents((data as any[]) || []);
    }
  }, []);

  const connectGoogle = useCallback(async (connectionType: "calendar" | "email" | "both") => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Please log in first", variant: "destructive" });
        return;
      }

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/google-calendar-auth`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: "get_auth_url", connectionType }),
        }
      );

      const data = await res.json();
      if (data.authUrl) {
        // Open Google OAuth in a popup
        const popup = window.open(data.authUrl, "google-auth", "width=500,height=600");
        
        // Listen for the OAuth callback
        const checkPopup = setInterval(async () => {
          try {
            if (popup?.closed) {
              clearInterval(checkPopup);
              // Refresh connections
              await fetchConnections();
              await fetchEvents();
              setLoading(false);
            }
            
            const popupUrl = popup?.location?.href;
            if (popupUrl?.includes("code=")) {
              clearInterval(checkPopup);
              const url = new URL(popupUrl);
              const code = url.searchParams.get("code");
              const state = url.searchParams.get("state");
              popup?.close();

              if (code) {
                const parsed = state ? JSON.parse(state) : {};
                const exchangeRes = await fetch(
                  `https://${projectId}.supabase.co/functions/v1/google-calendar-auth`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({
                      action: "exchange_code",
                      code,
                      connectionType: parsed.connectionType || connectionType,
                    }),
                  }
                );

                const result = await exchangeRes.json();
                if (result.success) {
                  toast({ title: "Connected successfully!", description: `Connected ${result.email}` });
                  await fetchConnections();
                  await fetchEvents();
                } else {
                  toast({ title: "Connection failed", description: result.error, variant: "destructive" });
                }
              }
              setLoading(false);
            }
          } catch {
            // Cross-origin - popup still on Google's domain
          }
        }, 500);
      } else {
        toast({ title: "Failed to start connection", variant: "destructive" });
        setLoading(false);
      }
    } catch (e) {
      console.error("Connect error:", e);
      toast({ title: "Connection error", variant: "destructive" });
      setLoading(false);
    }
  }, [toast, fetchConnections, fetchEvents]);

  const syncCalendar = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/google-calendar-sync`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({}),
        }
      );

      const data = await res.json();
      if (data.success) {
        toast({ title: "Calendar synced!", description: `${data.count} events imported` });
        await fetchEvents();
        await fetchConnections();
      } else {
        toast({ title: "Sync failed", description: data.error, variant: "destructive" });
      }
    } catch (e) {
      console.error("Sync error:", e);
      toast({ title: "Sync error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast, fetchEvents, fetchConnections]);

  const addManualEvent = useCallback(async (event: {
    title: string;
    start_time: string;
    end_time: string;
    all_day: boolean;
    category: string;
    description?: string;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("calendar_events").insert({
      user_id: user.id,
      title: event.title,
      description: event.description || null,
      start_time: event.start_time,
      end_time: event.end_time,
      all_day: event.all_day,
      category: event.category,
      source: "manual",
    } as any);

    if (error) {
      toast({ title: "Failed to add event", variant: "destructive" });
    } else {
      toast({ title: "Event added!" });
      await fetchEvents();
    }
  }, [toast, fetchEvents]);

  const approveDetectedEvent = useCallback(async (detected: DetectedEventRow) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Add to calendar events
    const { error: insertError } = await supabase.from("calendar_events").insert({
      user_id: user.id,
      title: detected.title,
      description: detected.description,
      start_time: detected.detected_date,
      end_time: detected.detected_end_date || detected.detected_date,
      all_day: true,
      category: detected.category,
      source: detected.source_type === "email" ? "email" : "document",
    } as any);

    if (insertError) {
      toast({ title: "Failed to add event", variant: "destructive" });
      return;
    }

    // Update detected event status
    await supabase
      .from("detected_events")
      .update({ status: "approved" } as any)
      .eq("id", detected.id);

    toast({ title: "Event added to calendar!" });
    await fetchEvents();
    await fetchDetectedEvents();
  }, [toast, fetchEvents, fetchDetectedEvents]);

  const dismissDetectedEvent = useCallback(async (eventId: string) => {
    await supabase
      .from("detected_events")
      .update({ status: "dismissed" } as any)
      .eq("id", eventId);
    await fetchDetectedEvents();
  }, [fetchDetectedEvents]);

  const disconnectCalendar = useCallback(async (connectionId: string) => {
    await supabase
      .from("calendar_connections")
      .update({ connected: false } as any)
      .eq("id", connectionId);
    toast({ title: "Calendar disconnected" });
    await fetchConnections();
  }, [toast, fetchConnections]);

  return {
    events,
    detectedEvents,
    connections,
    loading,
    fetchEvents,
    fetchConnections,
    fetchDetectedEvents,
    connectGoogle,
    syncCalendar,
    addManualEvent,
    approveDetectedEvent,
    dismissDetectedEvent,
    disconnectCalendar,
  };
}
