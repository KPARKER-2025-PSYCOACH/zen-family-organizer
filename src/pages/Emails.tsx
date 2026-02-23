import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, RefreshCw, Search, X, Upload, FileText } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useCalendarData } from "@/hooks/useCalendarData";
import { useDocumentScanner } from "@/hooks/useDocumentScanner";
import DetectedEventsDialog from "@/components/calendar/DetectedEventsDialog";
import { useToast } from "@/hooks/use-toast";

const CONFIDENCE_COLORS: Record<string, string> = {
  high: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-red-100 text-red-800 border-red-200",
};

interface EmailConnectionRow {
  id: string;
  provider: string;
  email: string | null;
  connected: boolean;
  last_scanned: string | null;
}

const EmailsPage = () => {
  const [emailConnections, setEmailConnections] = useState<EmailConnectionRow[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [detectedDialogOpen, setDetectedDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const {
    detectedEvents,
    fetchDetectedEvents,
    connectGoogle,
    approveDetectedEvent,
    dismissDetectedEvent,
    loading,
  } = useCalendarData();

  const { scanning, scanDocument } = useDocumentScanner();

  const fetchEmailConnections = async () => {
    const { data } = await supabase
      .from("email_connections")
      .select("*");
    setEmailConnections((data as any[]) || []);
  };

  useEffect(() => {
    fetchEmailConnections();
    fetchDetectedEvents();
  }, [fetchDetectedEvents]);

  const gmailConnection = emailConnections.find(
    (c) => c.provider === "gmail" && c.connected
  );

  const handleScanEmails = async () => {
    setIsScanning(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Please log in first", variant: "destructive" });
        return;
      }

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/scan-emails`,
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
        toast({
          title: `Found ${data.count} event${data.count !== 1 ? "s" : ""}`,
          description: "Review and approve detected events",
        });
        await fetchDetectedEvents();
        await fetchEmailConnections();
        if (data.count > 0) setDetectedDialogOpen(true);
      } else {
        toast({ title: "Scan failed", description: data.error, variant: "destructive" });
      }
    } catch (e) {
      console.error("Scan error:", e);
      toast({ title: "Scan error", variant: "destructive" });
    } finally {
      setIsScanning(false);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    await supabase
      .from("email_connections")
      .update({ connected: false } as any)
      .eq("id", connectionId);
    toast({ title: "Gmail disconnected" });
    await fetchEmailConnections();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const count = await scanDocument(file);
    if (count > 0) {
      await fetchDetectedEvents();
      setDetectedDialogOpen(true);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Email & Document Scanner"
        subtitle="Find important dates in your emails and documents"
      />

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Gmail Connection */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Gmail
                </CardTitle>
                <CardDescription>Connect your Gmail to scan for events</CardDescription>
              </CardHeader>
              <CardContent>
                {gmailConnection ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div>
                        <p className="font-medium text-sm">{gmailConnection.email}</p>
                        {gmailConnection.last_scanned && (
                          <p className="text-xs text-muted-foreground">
                            Last scanned: {new Date(gmailConnection.last_scanned).toLocaleString("en-GB")}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDisconnect(gmailConnection.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      onClick={handleScanEmails}
                      disabled={isScanning}
                      className="w-full gap-2"
                    >
                      {isScanning ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                      {isScanning ? "Scanning..." : "Scan Emails"}
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => connectGoogle("email")}
                    disabled={loading}
                    className="w-full gap-2"
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4" />
                    )}
                    Connect Gmail
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Document Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Upload Documents
                </CardTitle>
                <CardDescription>
                  Upload PDF or Word docs to find dates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={scanning}
                  variant="outline"
                  className="w-full gap-2"
                >
                  {scanning ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {scanning ? "Scanning..." : "Upload & Scan"}
                </Button>
              </CardContent>
            </Card>

            {/* Pending count */}
            {detectedEvents.length > 0 && (
              <Card className="border-primary/30">
                <CardContent className="pt-6">
                  <Button
                    onClick={() => setDetectedDialogOpen(true)}
                    className="w-full gap-2"
                  >
                    <Badge className="bg-primary-foreground text-primary">
                      {detectedEvents.length}
                    </Badge>
                    Review Detected Events
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* How it works */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border bg-secondary/30">
                    <div className="flex items-center gap-3 mb-2">
                      <Mail className="h-8 w-8 text-primary" />
                      <h3 className="font-semibold">Email Scanning</h3>
                    </div>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Connect your Gmail account</li>
                      <li>Click "Scan Emails" to analyse recent messages</li>
                      <li>AI detects dates, events, and appointments</li>
                      <li>Approve events to add them to your calendar</li>
                    </ol>
                  </div>
                  <div className="p-4 rounded-lg border bg-secondary/30">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="h-8 w-8 text-primary" />
                      <h3 className="font-semibold">Document Scanning</h3>
                    </div>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Upload a PDF, Word doc, or text file</li>
                      <li>AI reads the document for dates and events</li>
                      <li>Review detected events in a pop-up</li>
                      <li>Approve to add to your calendar</li>
                    </ol>
                  </div>
                </div>

                {detectedEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No pending events</p>
                    <p className="text-sm mt-1">
                      Connect Gmail or upload a document to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h3 className="font-semibold">
                      Pending Events ({detectedEvents.length})
                    </h3>
                    {detectedEvents.slice(0, 5).map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card"
                      >
                        <div>
                          <p className="font-medium text-sm">{event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(event.detected_date).toLocaleDateString("en-GB")}
                            {" · "}
                            {event.source_type === "email" ? "📧 Email" : "📄 Document"}
                          </p>
                        </div>
                        <Badge variant="outline" className={CONFIDENCE_COLORS[event.confidence]}>
                          {event.confidence}
                        </Badge>
                      </div>
                    ))}
                    {detectedEvents.length > 5 && (
                      <Button
                        variant="link"
                        onClick={() => setDetectedDialogOpen(true)}
                      >
                        View all {detectedEvents.length} events →
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <DetectedEventsDialog
        open={detectedDialogOpen}
        onOpenChange={setDetectedDialogOpen}
        events={detectedEvents}
        onApprove={approveDetectedEvent}
        onDismiss={dismissDetectedEvent}
      />
    </div>
  );
};

export default EmailsPage;
