import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Plus, RefreshCw, X, Settings, Upload, FileText } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useCalendarData } from "@/hooks/useCalendarData";
import { useDocumentScanner } from "@/hooks/useDocumentScanner";
import AddEventDialog from "@/components/calendar/AddEventDialog";
import DetectedEventsDialog from "@/components/calendar/DetectedEventsDialog";
import WeeklyPlanner from "@/components/calendar/WeeklyPlanner";

const CATEGORY_COLORS: Record<string, string> = {
  school: "bg-blue-100 text-blue-800 border-blue-200",
  health: "bg-red-100 text-red-800 border-red-200",
  travel: "bg-purple-100 text-purple-800 border-purple-200",
  birthday: "bg-pink-100 text-pink-800 border-pink-200",
  meal: "bg-green-100 text-green-800 border-green-200",
  work: "bg-orange-100 text-orange-800 border-orange-200",
  personal: "bg-yellow-100 text-yellow-800 border-yellow-200",
  other: "bg-secondary text-secondary-foreground border-border",
};

const CalendarPage = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [detectedDialogOpen, setDetectedDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
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
  } = useCalendarData();

  const { scanning, scanDocument } = useDocumentScanner();

  useEffect(() => {
    fetchEvents();
    fetchConnections();
    fetchDetectedEvents();
  }, [fetchEvents, fetchConnections, fetchDetectedEvents]);

  // Show detected events dialog when new ones arrive
  useEffect(() => {
    if (detectedEvents.length > 0) {
      setDetectedDialogOpen(true);
    }
  }, [detectedEvents.length]);

  const googleConnection = connections.find(
    (c) => c.provider === "google" && c.connected
  );

  const selectedDateEvents = events.filter((event) => {
    if (!date) return false;
    const eventDate = new Date(event.start_time).toDateString();
    return eventDate === date.toDateString();
  });

  // Highlight dates that have events
  const eventDates = events.map((e) => new Date(e.start_time));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const count = await scanDocument(file);
    if (count > 0) {
      await fetchDetectedEvents();
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Smart Calendar"
        subtitle="All your family events in one place"
      />

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Google Calendar Connection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Google Calendar
                </CardTitle>
                <CardDescription>Sync events from your Google account</CardDescription>
              </CardHeader>
              <CardContent>
                {googleConnection ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📅</span>
                        <div>
                          <p className="font-medium text-sm">Connected</p>
                          <p className="text-xs text-muted-foreground">
                            {googleConnection.email}
                          </p>
                          {googleConnection.last_synced && (
                            <p className="text-xs text-muted-foreground">
                              Last synced:{" "}
                              {new Date(googleConnection.last_synced).toLocaleString("en-GB")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={syncCalendar}
                          disabled={loading}
                        >
                          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => disconnectCalendar(googleConnection.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      onClick={syncCalendar}
                      disabled={loading}
                      className="w-full gap-2"
                      variant="outline"
                    >
                      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                      Sync Now
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => connectGoogle("calendar")}
                    disabled={loading}
                    className="w-full gap-2"
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <span>📅</span>
                    )}
                    Connect Google Calendar
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Document Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Scan Documents
                </CardTitle>
                <CardDescription>
                  Upload a PDF or Word doc to find dates
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

            {/* Pending approvals */}
            {detectedEvents.length > 0 && (
              <Card className="border-primary/30">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Badge className="bg-primary text-primary-foreground">
                      {detectedEvents.length}
                    </Badge>
                    Pending Approvals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => setDetectedDialogOpen(true)}
                    className="w-full"
                    variant="outline"
                  >
                    Review Detected Events
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Category Legend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Event Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(CATEGORY_COLORS).map(([category, colors]) => (
                    <Badge key={category} variant="outline" className={colors}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calendar View */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  <div className="flex justify-center">
                    <CalendarComponent
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      className="rounded-md border"
                      modifiers={{ hasEvent: eventDates }}
                      modifiersStyles={{
                        hasEvent: {
                          fontWeight: "bold",
                          textDecoration: "underline",
                          textDecorationColor: "hsl(175, 26%, 34%)",
                        },
                      }}
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">
                        {date?.toLocaleDateString("en-GB", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </h3>
                      <Button
                        size="sm"
                        className="gap-2"
                        onClick={() => setAddEventOpen(true)}
                      >
                        <Plus className="h-4 w-4" />
                        Add Event
                      </Button>
                    </div>

                    {selectedDateEvents.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No events on this day</p>
                        <p className="text-sm mt-1">
                          Connect a calendar or add events manually
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedDateEvents.map((event) => (
                          <div
                            key={event.id}
                            className="p-3 rounded-lg border bg-secondary/50"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium">{event.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {event.all_day
                                    ? "All day"
                                    : `${new Date(event.start_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} - ${new Date(event.end_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`}
                                </p>
                                {event.description && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {event.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {event.source !== "manual" && (
                                  <span className="text-xs text-muted-foreground">
                                    {event.source === "synced" ? "📅" : event.source === "email" ? "📧" : "📄"}
                                  </span>
                                )}
                                <Badge
                                  variant="outline"
                                  className={CATEGORY_COLORS[event.category] || CATEGORY_COLORS.other}
                                >
                                  {event.category}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Planner */}
          <div className="lg:col-span-2">
            <WeeklyPlanner weekStart={date || new Date()} />
          </div>
        </div>
      </div>

      <AddEventDialog
        open={addEventOpen}
        onOpenChange={setAddEventOpen}
        selectedDate={date}
        onAddEvent={addManualEvent}
      />

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

export default CalendarPage;
