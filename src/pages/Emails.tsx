import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, RefreshCw, Search, X, Calendar, AlertTriangle, Package, Tag, Ban, ShieldCheck } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useCalendarData } from "@/hooks/useCalendarData";
import DetectedEventsDialog from "@/components/calendar/DetectedEventsDialog";
import { useToast } from "@/hooks/use-toast";

interface EmailConnectionRow {
  id: string;
  provider: string;
  email: string | null;
  connected: boolean;
  last_scanned: string | null;
}

interface DetectedItem {
  id: string;
  title: string;
  detected_date: string;
  detected_end_date: string | null;
  source_subject: string | null;
  source_from: string | null;
  source_type: string;
  confidence: string;
  category: string;
  email_category: string;
  suggest_gift: boolean;
  gift_reason: string | null;
  description: string | null;
  status: string;
}

interface BlockedSender {
  id: string;
  sender_email: string;
  sender_name: string | null;
  blocked_at: string;
}

const CONFIDENCE_COLORS: Record<string, string> = {
  high: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-red-100 text-red-800 border-red-200",
};

const EmailsPage = () => {
  const [emailConnections, setEmailConnections] = useState<EmailConnectionRow[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [detectedDialogOpen, setDetectedDialogOpen] = useState(false);
  const [allItems, setAllItems] = useState<DetectedItem[]>([]);
  const [blockedSenders, setBlockedSenders] = useState<BlockedSender[]>([]);
  const [showBlocked, setShowBlocked] = useState(false);
  const { toast } = useToast();

  const {
    detectedEvents,
    fetchDetectedEvents,
    connectGoogle,
    approveDetectedEvent,
    dismissDetectedEvent,
    loading,
  } = useCalendarData();

  const fetchEmailConnections = async () => {
    const { data } = await supabase.from("email_connections").select("*");
    setEmailConnections((data as any[]) || []);
  };

  const fetchAllItems = async () => {
    const { data } = await supabase
      .from("detected_events")
      .select("*")
      .eq("source_type", "email")
      .eq("status", "pending")
      .order("detected_date", { ascending: true });
    setAllItems((data as any[]) || []);
  };

  const fetchBlockedSenders = async () => {
    const { data } = await supabase.from("blocked_senders").select("*").order("blocked_at", { ascending: false });
    setBlockedSenders((data as any[]) || []);
  };

  useEffect(() => {
    fetchEmailConnections();
    fetchAllItems();
    fetchBlockedSenders();
    fetchDetectedEvents();
  }, [fetchDetectedEvents]);

  const gmailConnection = emailConnections.find((c) => c.provider === "gmail" && c.connected);

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
          title: `Scanned ${data.count} item${data.count !== 1 ? "s" : ""}`,
          description: "Review categorised emails below",
        });
        await fetchAllItems();
        await fetchDetectedEvents();
        await fetchEmailConnections();
        // Show detected events dialog if there are event-type items
        if (data.count > 0) {
          setDetectedDialogOpen(true);
        }
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
    await supabase.from("email_connections").update({ connected: false } as any).eq("id", connectionId);
    toast({ title: "Gmail disconnected" });
    await fetchEmailConnections();
  };

  const handleBlockSender = async (senderFrom: string) => {
    const emailMatch = senderFrom.match(/<([^>]+)>/);
    const senderEmail = emailMatch ? emailMatch[1] : senderFrom;
    const senderName = emailMatch ? senderFrom.replace(/<[^>]+>/, "").trim() : null;

    const { error } = await supabase.from("blocked_senders").insert({
      sender_email: senderEmail.toLowerCase(),
      sender_name: senderName,
    } as any);

    if (!error) {
      toast({ title: "Sender blocked", description: `Emails from ${senderEmail} will be ignored` });
      // Dismiss all pending items from this sender
      const senderItems = allItems.filter((item) => {
        const match = item.source_from?.match(/<([^>]+)>/);
        const itemEmail = match ? match[1].toLowerCase() : item.source_from?.toLowerCase();
        return itemEmail === senderEmail.toLowerCase();
      });
      for (const item of senderItems) {
        await dismissDetectedEvent(item.id);
      }
      await fetchAllItems();
      await fetchBlockedSenders();
    }
  };

  const handleUnblockSender = async (id: string) => {
    await supabase.from("blocked_senders").delete().eq("id", id);
    toast({ title: "Sender unblocked" });
    await fetchBlockedSenders();
  };

  // Categorise items
  const eventItems = allItems.filter((i) => i.email_category === "event");
  const actionItems = allItems.filter((i) => i.email_category === "action_required");
  const orderItems = allItems.filter((i) => i.email_category === "order");
  const promoItems = allItems.filter((i) => i.email_category === "promotion");

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Email Scanner" subtitle="AI-powered email insights and event detection" />

      <div className="container mx-auto px-4 py-8">
        {/* Connection & Controls */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Card className="flex-1 min-w-[280px]">
            <CardContent className="pt-6">
              {gmailConnection ? (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{gmailConnection.email}</p>
                      {gmailConnection.last_scanned && (
                        <p className="text-xs text-muted-foreground">
                          Last scanned: {new Date(gmailConnection.last_scanned).toLocaleString("en-GB")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleScanEmails} disabled={isScanning} size="sm" className="gap-2">
                      {isScanning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      {isScanning ? "Scanning..." : "Scan"}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDisconnect(gmailConnection.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => connectGoogle("email")} disabled={loading} className="w-full gap-2">
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Connect Gmail
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Blocked senders toggle */}
          <Button variant="outline" className="gap-2 self-center" onClick={() => setShowBlocked(!showBlocked)}>
            <Ban className="h-4 w-4" />
            Blocked ({blockedSenders.length})
          </Button>
        </div>

        {/* Blocked senders panel */}
        {showBlocked && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Ban className="h-4 w-4" /> Blocked Senders
              </CardTitle>
              <CardDescription>Emails from these senders are automatically ignored</CardDescription>
            </CardHeader>
            <CardContent>
              {blockedSenders.length === 0 ? (
                <p className="text-sm text-muted-foreground">No blocked senders</p>
              ) : (
                <div className="space-y-2">
                  {blockedSenders.map((b) => (
                    <div key={b.id} className="flex items-center justify-between p-3 rounded-lg border bg-secondary/30">
                      <div>
                        <p className="text-sm font-medium">{b.sender_name || b.sender_email}</p>
                        {b.sender_name && <p className="text-xs text-muted-foreground">{b.sender_email}</p>}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleUnblockSender(b.id)} className="gap-1">
                        <ShieldCheck className="h-3 w-3" /> Unblock
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Sectioned email results */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Events to add to calendar */}
          <EmailSection
            icon={<Calendar className="h-5 w-5" />}
            title="Events & Dates"
            description="Appointments, meetings, and dates to add to your calendar"
            items={eventItems}
            onApprove={async (item) => { await approveDetectedEvent(item as any); await fetchAllItems(); }}
            onDismiss={async (id) => { await dismissDetectedEvent(id); await fetchAllItems(); }}
            onBlock={handleBlockSender}
            emptyMessage="No events detected"
            accentColor="text-blue-600"
          />

          {/* Action required */}
          <EmailSection
            icon={<AlertTriangle className="h-5 w-5" />}
            title="Action Required"
            description="Invoices, school forms, payments, and emails needing your attention"
            items={actionItems}
            onDismiss={async (id) => { await dismissDetectedEvent(id); await fetchAllItems(); }}
            onBlock={handleBlockSender}
            emptyMessage="Nothing needs your attention"
            accentColor="text-amber-600"
          />

          {/* Orders */}
          <EmailSection
            icon={<Package className="h-5 w-5" />}
            title="Orders & Deliveries"
            description="Shipping updates, order confirmations, and delivery tracking"
            items={orderItems}
            onDismiss={async (id) => { await dismissDetectedEvent(id); await fetchAllItems(); }}
            onBlock={handleBlockSender}
            emptyMessage="No orders detected"
            accentColor="text-green-600"
          />

          {/* Promotions */}
          <EmailSection
            icon={<Tag className="h-5 w-5" />}
            title="Promotions & Offers"
            description="Deals, discounts, and newsletters"
            items={promoItems}
            onDismiss={async (id) => { await dismissDetectedEvent(id); await fetchAllItems(); }}
            onBlock={handleBlockSender}
            emptyMessage="No promotions found"
            accentColor="text-purple-600"
          />
        </div>

        {/* Show pending email events for calendar approval */}
        {eventItems.length > 0 && (
          <div className="mt-6">
            <Button onClick={() => setDetectedDialogOpen(true)} variant="outline" className="gap-2">
              <Badge className="bg-primary text-primary-foreground">{eventItems.length}</Badge>
              Review Events to Add to Calendar
            </Button>
          </div>
        )}
      </div>

      <DetectedEventsDialog
        open={detectedDialogOpen}
        onOpenChange={setDetectedDialogOpen}
        events={eventItems.map(item => ({
          ...item,
          user_id: "",
          created_at: "",
        })) as any}
        onApprove={async (event) => { await approveDetectedEvent(event as any); await fetchAllItems(); }}
        onDismiss={async (id) => { await dismissDetectedEvent(id); await fetchAllItems(); }}
      />
    </div>
  );
};

interface EmailSectionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  items: DetectedItem[];
  onApprove?: (item: DetectedItem) => Promise<void>;
  onDismiss: (id: string) => Promise<void>;
  onBlock: (senderFrom: string) => Promise<void>;
  emptyMessage: string;
  accentColor: string;
}

const EmailSection = ({ icon, title, description, items, onApprove, onDismiss, onBlock, emptyMessage, accentColor }: EmailSectionProps) => (
  <Card>
    <CardHeader>
      <CardTitle className={`flex items-center gap-2 text-base ${accentColor}`}>
        {icon}
        {title}
        {items.length > 0 && (
          <Badge variant="secondary" className="ml-auto">{items.length}</Badge>
        )}
      </CardTitle>
      <CardDescription className="text-xs">{description}</CardDescription>
    </CardHeader>
    <CardContent>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">{emptyMessage}</p>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {items.map((item) => (
            <div key={item.id} className="p-3 rounded-lg border bg-secondary/30 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.detected_date).toLocaleDateString("en-GB")}
                    </span>
                    {item.source_from && (
                      <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                        · from {item.source_from}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className={CONFIDENCE_COLORS[item.confidence]}>
                  {item.confidence}
                </Badge>
              </div>
              <div className="flex gap-2 justify-end">
                {onApprove && (
                  <Button size="sm" variant="default" onClick={() => onApprove(item)} className="text-xs h-7">
                    Add to Calendar
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => onDismiss(item.id)} className="text-xs h-7">
                  Dismiss
                </Button>
                {item.source_from && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onBlock(item.source_from!)}
                    className="text-xs h-7 text-destructive hover:text-destructive"
                  >
                    <Ban className="h-3 w-3 mr-1" /> Block
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

export default EmailsPage;
