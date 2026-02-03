import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Plus, RefreshCw, Check, X, Settings } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import type { CalendarConnection, CalendarEvent } from "@/types";

const CALENDAR_PROVIDERS = [
  { 
    id: 'google', 
    name: 'Google Calendar', 
    icon: '📅',
    description: 'Sync with your Google account'
  },
  { 
    id: 'apple', 
    name: 'Apple Calendar', 
    icon: '🍎',
    description: 'Sync with iCloud'
  },
  { 
    id: 'outlook', 
    name: 'Outlook Calendar', 
    icon: '📧',
    description: 'Sync with Microsoft account'
  },
] as const;

const CATEGORY_COLORS: Record<CalendarEvent['category'], string> = {
  school: 'bg-blue-100 text-blue-800 border-blue-200',
  health: 'bg-red-100 text-red-800 border-red-200',
  travel: 'bg-purple-100 text-purple-800 border-purple-200',
  birthday: 'bg-pink-100 text-pink-800 border-pink-200',
  meal: 'bg-green-100 text-green-800 border-green-200',
  work: 'bg-orange-100 text-orange-800 border-orange-200',
  personal: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  other: 'bg-gray-100 text-gray-800 border-gray-200',
};

const CalendarPage = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [connections, setConnections] = useState<CalendarConnection[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  const handleConnect = async (providerId: string) => {
    setIsConnecting(providerId);
    // TODO: Implement OAuth flow for calendar providers
    // This will require Google Calendar API, Apple Calendar API, or Microsoft Graph API
    setTimeout(() => {
      setIsConnecting(null);
      // Mock connection for now
      alert(`OAuth integration for ${providerId} will be implemented. You'll need to configure OAuth credentials.`);
    }, 1000);
  };

  const handleSync = async (connectionId: string) => {
    // TODO: Sync events from connected calendar
    console.log('Syncing calendar:', connectionId);
  };

  const handleDisconnect = (connectionId: string) => {
    setConnections(connections.filter(c => c.id !== connectionId));
  };

  const selectedDateEvents = events.filter(
    event => date && event.start.toDateString() === date.toDateString()
  );

  return (
    <div className="min-h-screen bg-background">
      <PageHeader 
        title="Smart Calendar" 
        subtitle="All your family events in one place"
      />

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Calendar Connections */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Connected Calendars
                </CardTitle>
                <CardDescription>
                  Sync your calendars to see all events
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {CALENDAR_PROVIDERS.map((provider) => {
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
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleSync(connection.id)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDisconnect(connection.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
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
              </CardContent>
            </Card>

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
                    />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">
                        {date?.toLocaleDateString('en-GB', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'long' 
                        })}
                      </h3>
                      <Button size="sm" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Event
                      </Button>
                    </div>
                    
                    {selectedDateEvents.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No events on this day</p>
                        <p className="text-sm mt-1">Connect a calendar or add events manually</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedDateEvents.map(event => (
                          <div 
                            key={event.id}
                            className="p-3 rounded-lg border bg-secondary/50"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-medium">{event.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {event.allDay ? 'All day' : 
                                    `${event.start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} - 
                                     ${event.end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
                                  }
                                </p>
                              </div>
                              <Badge variant="outline" className={CATEGORY_COLORS[event.category]}>
                                {event.category}
                              </Badge>
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
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
