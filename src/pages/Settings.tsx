import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCalendarData } from "@/hooks/useCalendarData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Calendar, Mail, Bell, Shield, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

const Settings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { connectGoogle, fetchConnections, connections, loading: calLoading } = useCalendarData();
  const [processingOAuth, setProcessingOAuth] = useState(false);

  // Handle OAuth callback redirect
  useEffect(() => {
    const code = searchParams.get("oauth_code");
    const state = searchParams.get("oauth_state");
    const error = searchParams.get("oauth_error");

    if (error) {
      toast({ title: "Connection failed", description: error, variant: "destructive" });
      setSearchParams({}, { replace: true });
      return;
    }

    if (code && state) {
      setProcessingOAuth(true);
      const exchangeCode = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;

          const parsed = JSON.parse(state);
          const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
          const res = await fetch(
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
                connectionType: parsed.connectionType || "calendar",
              }),
            }
          );

          const result = await res.json();
          if (result.success) {
            toast({ title: "Connected successfully!", description: `Connected ${result.email}` });
            await fetchConnections();
          } else {
            toast({ title: "Connection failed", description: result.error, variant: "destructive" });
          }
        } catch (e) {
          console.error("OAuth exchange error:", e);
          toast({ title: "Connection error", variant: "destructive" });
        } finally {
          setProcessingOAuth(false);
          setSearchParams({}, { replace: true });
        }
      };
      exchangeCode();
    }
  }, [searchParams, setSearchParams, toast, fetchConnections]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-sm text-muted-foreground">Manage your preferences and privacy</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Calendar settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Calendar connections</CardTitle>
                <CardDescription>Manage which calendars sync with Parent Assist</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {processingOAuth && (
              <div className="p-4 rounded-lg bg-primary/10 text-sm text-center">
                Connecting your account...
              </div>
            )}
            <div className="space-y-4">
              <ConnectionItem 
                name="Google Calendar"
                status={connections.some(c => c.provider === "google" && c.connected) ? "Connected" : "Not connected"}
                lastSync={connections.find(c => c.provider === "google")?.last_synced || null}
                onConnect={() => connectGoogle("calendar")}
                loading={calLoading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Email settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Email parsing</CardTitle>
                <CardDescription>Control which emails we scan for events</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingToggle
              label="Scan inbox for events"
              description="Allow Parent Assist to detect dates and appointments"
              defaultChecked={true}
            />
            <SettingToggle
              label="Include sent folder"
              description="Also scan emails you've sent"
              defaultChecked={false}
            />
            <div className="pt-2">
              <Label className="text-sm font-medium">Folders to scan</Label>
              <p className="text-sm text-muted-foreground mb-3">Choose which email folders to monitor</p>
              <div className="space-y-2">
                <SettingToggle label="Inbox" defaultChecked={true} />
                <SettingToggle label="School" defaultChecked={true} />
                <SettingToggle label="Family" defaultChecked={true} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage how we keep you informed</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingToggle
              label="Daily digest"
              description="Summary of upcoming events and tasks"
              defaultChecked={true}
            />
            <SettingToggle
              label="Event reminders"
              description="Nudges before important appointments"
              defaultChecked={true}
            />
            <SettingToggle
              label="Shopping suggestions"
              description="Timely reminders for uniform, gifts, and more"
              defaultChecked={true}
            />
            <div className="pt-2">
              <Label className="text-sm font-medium">Quiet hours</Label>
              <p className="text-sm text-muted-foreground mb-3">No notifications during these times</p>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="quietStart" className="text-xs">Start</Label>
                  <input 
                    id="quietStart"
                    type="time" 
                    defaultValue="22:00"
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="quietEnd" className="text-xs">End</Label>
                  <input 
                    id="quietEnd"
                    type="time" 
                    defaultValue="07:00"
                    className="w-full px-3 py-2 rounded-md border bg-background text-sm"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Privacy & data</CardTitle>
                <CardDescription>Your data, your control</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingToggle
              label="Improve suggestions with usage data"
              description="Help us make better recommendations"
              defaultChecked={true}
            />
            <div className="pt-4 space-y-3 border-t">
              <Button variant="outline" className="w-full justify-start">
                Download all my data
              </Button>
              <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete my account
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Done button */}
        <div className="flex justify-end pt-2 pb-8">
          <Link to="/calendar">
            <Button size="lg">
              Done
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

const ConnectionItem = ({ name, status, lastSync, onConnect, loading }: { name: string; status: string; lastSync: string | null; onConnect?: () => void; loading?: boolean }) => (
  <div className="flex items-center justify-between p-4 rounded-lg border bg-secondary/30">
    <div>
      <p className="font-medium">{name}</p>
      {lastSync && <p className="text-sm text-muted-foreground">Last synced {lastSync}</p>}
    </div>
    <div className="flex items-center gap-3">
      <span className={`text-sm font-medium ${status === 'Connected' ? 'text-success' : 'text-muted-foreground'}`}>
        {status}
      </span>
      {status === 'Connected' && (
        <Button variant="ghost" size="sm">
          Disconnect
        </Button>
      )}
      {status !== 'Connected' && (
        <Button size="sm" onClick={onConnect} disabled={loading}>
          {loading ? "Connecting..." : "Connect"}
        </Button>
      )}
    </div>
  </div>
);

const SettingToggle = ({ 
  label, 
  description, 
  defaultChecked 
}: { 
  label: string; 
  description?: string;
  defaultChecked?: boolean;
}) => (
  <div className="flex items-center justify-between gap-4">
    <div className="flex-1">
      <Label htmlFor={label} className="text-sm font-medium cursor-pointer">
        {label}
      </Label>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
    <Switch id={label} defaultChecked={defaultChecked} />
  </div>
);

export default Settings;
