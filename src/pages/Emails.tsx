import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, RefreshCw, X, Calendar, Gift, Check, AlertCircle, Inbox } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import type { EmailConnection, DetectedEvent } from "@/types";

const EMAIL_PROVIDERS = [
  { 
    id: 'gmail', 
    name: 'Gmail', 
    icon: '📧',
    description: 'Connect your Google account'
  },
  { 
    id: 'outlook', 
    name: 'Outlook', 
    icon: '📬',
    description: 'Connect your Microsoft account'
  },
  { 
    id: 'yahoo', 
    name: 'Yahoo Mail', 
    icon: '📨',
    description: 'Connect your Yahoo account'
  },
  { 
    id: 'icloud', 
    name: 'iCloud Mail', 
    icon: '☁️',
    description: 'Connect your Apple account'
  },
] as const;

const CONFIDENCE_COLORS = {
  high: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-orange-100 text-orange-800 border-orange-200',
};

const EmailsPage = () => {
  const [connections, setConnections] = useState<EmailConnection[]>([]);
  const [detectedEvents, setDetectedEvents] = useState<DetectedEvent[]>([]);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const handleConnect = async (providerId: string) => {
    setIsConnecting(providerId);
    // TODO: Implement OAuth flow for email providers
    setTimeout(() => {
      setIsConnecting(null);
      alert(`OAuth integration for ${providerId} will be implemented. You'll need to configure OAuth credentials.`);
    }, 1000);
  };

  const handleDisconnect = (connectionId: string) => {
    setConnections(connections.filter(c => c.id !== connectionId));
  };

  const handleScan = async () => {
    if (connections.length === 0) {
      alert('Please connect an email account first');
      return;
    }
    setIsScanning(true);
    // TODO: Implement email scanning with AI
    setTimeout(() => {
      setIsScanning(false);
      // Mock detected events for demo
      setDetectedEvents([
        {
          id: '1',
          emailSubject: 'Birthday Party Invitation - Sophie turns 7!',
          emailFrom: 'sarah@example.com',
          detectedDate: new Date('2025-11-15'),
          detectedTime: '14:00',
          title: "Sophie's 7th Birthday Party",
          confidence: 'high',
          suggestGift: true,
          giftReason: 'Birthday celebration',
          approved: false,
        },
        {
          id: '2',
          emailSubject: 'School Newsletter - End of Term Events',
          emailFrom: 'school@example.edu',
          detectedDate: new Date('2025-12-19'),
          title: 'End of Term Assembly',
          confidence: 'medium',
          suggestGift: true,
          giftReason: 'Teacher appreciation gift opportunity',
          approved: false,
        },
        {
          id: '3',
          emailSubject: 'Dentist Appointment Confirmation',
          emailFrom: 'dentist@example.com',
          detectedDate: new Date('2025-10-28'),
          detectedTime: '10:30',
          title: 'Dentist Appointment',
          confidence: 'high',
          suggestGift: false,
          approved: false,
        },
      ]);
    }, 2000);
  };

  const handleApprove = (eventId: string) => {
    setDetectedEvents(events => 
      events.map(e => e.id === eventId ? { ...e, approved: true } : e)
    );
    // TODO: Add to calendar
  };

  const handleDismiss = (eventId: string) => {
    setDetectedEvents(events => events.filter(e => e.id !== eventId));
  };

  const handleAddToGifts = (event: DetectedEvent) => {
    // TODO: Navigate to gifts page with pre-filled data
    alert(`Add gift reminder for: ${event.title}`);
  };

  const pendingEvents = detectedEvents.filter(e => !e.approved);
  const approvedEvents = detectedEvents.filter(e => e.approved);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="Email Inbox" 
        subtitle="Detect events and dates from your emails"
      />

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Email Connections */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Connected Inboxes
                </CardTitle>
                <CardDescription>
                  Connect your email to scan for events
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {EMAIL_PROVIDERS.map((provider) => {
                  const connection = connections.find(c => c.provider === provider.id);
                  
                  return (
                    <div 
                      key={provider.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{provider.icon}</span>
                        <div>
                          <p className="font-medium text-sm">{provider.name}</p>
                          {connection ? (
                            <p className="text-xs text-muted-foreground">{connection.email}</p>
                          ) : (
                            <p className="text-xs text-muted-foreground">{provider.description}</p>
                          )}
                        </div>
                      </div>
                      
                      {connection ? (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleDisconnect(connection.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button 
                          size="sm"
                          onClick={() => handleConnect(provider.id)}
                          disabled={isConnecting === provider.id}
                        >
                          {isConnecting === provider.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            'Connect'
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })}

                <Button 
                  className="w-full mt-4" 
                  onClick={handleScan}
                  disabled={isScanning || connections.length === 0}
                >
                  {isScanning ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Scanning emails...
                    </>
                  ) : (
                    <>
                      <Inbox className="h-4 w-4 mr-2" />
                      Scan for Events
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Scan Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Folders to Scan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {['Inbox', 'Important', 'Starred', 'Sent'].map((folder) => (
                  <div key={folder} className="flex items-center space-x-2">
                    <Checkbox id={folder} defaultChecked={folder === 'Inbox'} />
                    <label
                      htmlFor={folder}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {folder}
                    </label>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Detected Events */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pending Approval */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  Pending Approval ({pendingEvents.length})
                </CardTitle>
                <CardDescription>
                  Review detected events before adding to your calendar
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No pending events</p>
                    <p className="text-sm mt-1">Connect an inbox and scan to detect events</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingEvents.map(event => (
                      <div 
                        key={event.id}
                        className="p-4 rounded-lg border bg-secondary/30"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{event.title}</h4>
                              <Badge variant="outline" className={CONFIDENCE_COLORS[event.confidence]}>
                                {event.confidence} confidence
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              From: {event.emailSubject}
                            </p>
                            <p className="text-sm">
                              <Calendar className="h-3 w-3 inline mr-1" />
                              {event.detectedDate.toLocaleDateString('en-GB', { 
                                weekday: 'long', 
                                day: 'numeric', 
                                month: 'long',
                                year: 'numeric'
                              })}
                              {event.detectedTime && ` at ${event.detectedTime}`}
                            </p>
                            
                            {event.suggestGift && (
                              <div className="mt-3 p-2 rounded bg-pink-50 border border-pink-200">
                                <p className="text-sm text-pink-800 flex items-center gap-1">
                                  <Gift className="h-4 w-4" />
                                  Gift opportunity: {event.giftReason}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => handleApprove(event.id)}
                              className="gap-1"
                            >
                              <Check className="h-4 w-4" />
                              Add to Calendar
                            </Button>
                            {event.suggestGift && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleAddToGifts(event)}
                                className="gap-1"
                              >
                                <Gift className="h-4 w-4" />
                                Add Gift Reminder
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleDismiss(event.id)}
                            >
                              <X className="h-4 w-4" />
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recently Approved */}
            {approvedEvents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <Check className="h-5 w-5" />
                    Recently Added ({approvedEvents.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {approvedEvents.map(event => (
                      <div 
                        key={event.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200"
                      >
                        <div>
                          <p className="font-medium text-green-800">{event.title}</p>
                          <p className="text-sm text-green-600">
                            {event.detectedDate.toLocaleDateString('en-GB')}
                          </p>
                        </div>
                        <Badge className="bg-green-600">Added to Calendar</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailsPage;
