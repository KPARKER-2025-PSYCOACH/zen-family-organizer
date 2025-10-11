import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Calendar, Mail, Bell, Shield, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

const Settings = () => {
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
            <div className="space-y-4">
              <ConnectionItem 
                name="Google Calendar"
                status="Connected"
                lastSync="2 minutes ago"
              />
              <ConnectionItem 
                name="Apple Calendar"
                status="Not connected"
                lastSync={null}
              />
              <ConnectionItem 
                name="Android Calendar"
                status="Not connected"
                lastSync={null}
              />
            </div>
            <Button variant="outline" className="w-full">
              Add calendar connection
            </Button>
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
      </div>
    </div>
  );
};

const ConnectionItem = ({ name, status, lastSync }: { name: string; status: string; lastSync: string | null }) => (
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
        <Button size="sm">
          Connect
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
