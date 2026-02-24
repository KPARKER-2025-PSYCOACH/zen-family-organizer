import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Mail, UtensilsCrossed, Gift, Settings, Plus, LogOut, PoundSterling, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format, isToday, isTomorrow, isThisWeek, parseISO } from "date-fns";
import FamilyMembersSection from "@/components/family/FamilyMembersSection";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";
import { useCalendarData, type CalendarEventRow } from "@/hooks/useCalendarData";
import calendarImage from "@/assets/calendar.jpg";
import emailImage from "@/assets/email.jpg";
import kitchenImage from "@/assets/kitchen.jpg";
import giftsImage from "@/assets/gifts.jpg";
import spendingImage from "@/assets/spending.jpg";
import tasksImage from "@/assets/tasks.jpg";

const Dashboard = () => {
  const navigate = useNavigate();
  const { members, loading: membersLoading, addMember, updateMember, deleteMember } = useFamilyMembers();
  const { events, detectedEvents, fetchEvents, fetchDetectedEvents } = useCalendarData();

  useEffect(() => {
    fetchEvents();
    fetchDetectedEvents();
  }, [fetchEvents, fetchDetectedEvents]);

  const handleLogout = () => {
    navigate("/");
  };

  // Get upcoming events (today + this week)
  const upcomingEvents = events
    .filter(e => {
      const start = parseISO(e.start_time);
      return start >= new Date() || isToday(start);
    })
    .slice(0, 4);

  // Get today's date formatted
  const todayFormatted = format(new Date(), "EEEE, d MMM yyyy");

  const formatEventTime = (event: CalendarEventRow) => {
    if (event.all_day) return "All day";
    return format(parseISO(event.start_time), "HH:mm");
  };

  const formatEventDay = (event: CalendarEventRow) => {
    const start = parseISO(event.start_time);
    if (isToday(start)) return "Today";
    if (isTomorrow(start)) return "Tomorrow";
    return format(start, "EEE");
  };

  // Pending detected events count
  const pendingEmails = detectedEvents.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Banner Header */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#f5f3f0] to-[#faf9f7] py-8 px-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(201,184,168,0.08)_0%,transparent_70%)] rounded-full" />
        <div className="absolute top-6 right-6 z-10 flex gap-2">
          <Link to="/settings">
            <Button variant="outline" size="default">Settings</Button>
          </Link>
          <Button variant="outline" size="default" onClick={handleLogout}>Log out</Button>
        </div>
        <div className="relative z-[2] flex flex-col items-center text-center">
          <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#c9b8a8] to-transparent mb-5" />
          <h1 className="text-4xl sm:text-5xl font-normal text-[#2d2d2d] tracking-wide mb-2">Parent Assist</h1>
          <p className="text-sm text-[#8a8a8a] font-light tracking-wide">Family Hub</p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Family Members */}
        <FamilyMembersSection
          members={members}
          loading={membersLoading}
          onAdd={addMember}
          onUpdate={updateMember}
          onDelete={deleteMember}
        />

        {/* Quick overview */}
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">Today's overview</h2>
          <p className="text-muted-foreground">{todayFormatted}</p>
        </div>

        {/* Main sections */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Calendar */}
          <div id="calendar-section">
            <DashboardCard
              icon={<Calendar className="h-6 w-6" />}
              title="Smart calendar"
              description="All your family events in one place"
              actionLabel="View calendar"
              actionHref="/calendar"
              backgroundImage={calendarImage}
            >
              {upcomingEvents.length === 0 ? (
                <div className="pt-4 text-center py-8">
                  <p className="text-muted-foreground">No upcoming events</p>
                  <p className="text-sm text-muted-foreground mt-1">Connect a calendar or add events to get started</p>
                </div>
              ) : (
                <div className="pt-2 space-y-2">
                  {upcomingEvents.map(event => (
                    <EventItem
                      key={event.id}
                      time={`${formatEventDay(event)} ${formatEventTime(event)}`}
                      title={event.title}
                      category={event.category}
                    />
                  ))}
                  {events.length > 4 && (
                    <Link to="/calendar" className="block text-sm text-primary hover:underline text-center pt-1">
                      View all {events.length} events →
                    </Link>
                  )}
                </div>
              )}
            </DashboardCard>
          </div>

          {/* Email parsing */}
          <div id="email-section">
            <DashboardCard
              icon={<Mail className="h-6 w-6" />}
              title="Email inbox"
              description="Events detected from your emails"
              actionLabel="Review emails"
              actionHref="/emails"
              backgroundImage={emailImage}
            >
              {pendingEmails === 0 ? (
                <div className="pt-4 text-center py-8">
                  <p className="text-muted-foreground">No pending emails</p>
                  <p className="text-sm text-muted-foreground mt-1">Connect your inbox to detect events</p>
                </div>
              ) : (
                <div className="pt-2 space-y-2">
                  {detectedEvents.slice(0, 3).map(de => (
                    <EmailItem
                      key={de.id}
                      subject={de.title}
                      detail={de.source_from || de.source_subject || ""}
                      confidence={de.confidence}
                    />
                  ))}
                  {pendingEmails > 3 && (
                    <Link to="/emails" className="block text-sm text-primary hover:underline text-center pt-1">
                      {pendingEmails - 3} more pending →
                    </Link>
                  )}
                </div>
              )}
            </DashboardCard>
          </div>

          {/* Meal planning */}
          <div id="meals-section">
            <DashboardCard
              icon={<UtensilsCrossed className="h-6 w-6" />}
              title="Meal planner"
              description="This week's meals and shopping list"
              actionLabel="Plan meals"
              actionHref="/meals"
              backgroundImage={kitchenImage}
            >
              <div className="pt-4 text-center py-8">
                <p className="text-muted-foreground">No meals planned</p>
                <p className="text-sm text-muted-foreground mt-1">Start planning your week</p>
              </div>
            </DashboardCard>
          </div>

          {/* Gift suggestions */}
          <div id="gifts-section">
            <DashboardCard
              icon={<Gift className="h-6 w-6" />}
              title="Gift ideas"
              description="Upcoming occasions and suggestions"
              actionLabel="Browse gifts"
              actionHref="/gifts"
              backgroundImage={giftsImage}
            >
              <div className="pt-4 text-center py-8">
                <p className="text-muted-foreground">No upcoming occasions</p>
                <p className="text-sm text-muted-foreground mt-1">Add events to get gift suggestions</p>
              </div>
            </DashboardCard>
          </div>

          {/* Family Spending */}
          <div id="spending-section">
            <DashboardCard
              icon={<PoundSterling className="h-6 w-6" />}
              title="Track spending"
              description="Track your household spending with Google Sheets"
              actionLabel="View spending"
              actionHref="/spending"
              backgroundImage={spendingImage}
            >
              <div className="pt-4 text-center py-8">
                <p className="text-muted-foreground">No budget created yet</p>
                <p className="text-sm text-muted-foreground mt-1">Create a spending spreadsheet to get started</p>
              </div>
            </DashboardCard>
          </div>

          {/* Balance Family Tasks */}
          <div id="tasks-section">
            <DashboardCard
              icon={<Users className="h-6 w-6" />}
              title="Balance family tasks"
              description="Assign and share household responsibilities"
              actionLabel="Manage tasks"
              actionHref="/tasks"
              backgroundImage={tasksImage}
            >
              <div className="pt-4 text-center py-8">
                <p className="text-muted-foreground">No tasks assigned yet</p>
                <p className="text-sm text-muted-foreground mt-1">Add family members and drag tasks to get started</p>
              </div>
            </DashboardCard>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardCard = ({ 
  icon, title, description, actionLabel, actionHref, backgroundImage, children 
}: { 
  icon: React.ReactNode; title: string; description: string; actionLabel: string; actionHref: string; backgroundImage?: string; children: React.ReactNode;
}) => (
  <Card className="relative overflow-hidden shadow-soft hover:shadow-glow transition-all">
    {backgroundImage && (
      <>
        <div className="absolute inset-0 bg-cover bg-center opacity-25" style={{ backgroundImage: `url(${backgroundImage})` }} />
        <div className="absolute inset-0 bg-gradient-to-br from-card/70 to-card/90" />
      </>
    )}
    <CardHeader className="relative z-10">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="text-primary">{icon}</div>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
        <Link to={actionHref}>
          <Button variant="ghost" size="sm">{actionLabel}</Button>
        </Link>
      </div>
    </CardHeader>
    <CardContent className="relative z-10">{children}</CardContent>
  </Card>
);

const EventItem = ({ time, title, category }: { time: string; title: string; category: string }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border">
    <div className="text-sm font-mono text-muted-foreground w-24 shrink-0">{time}</div>
    <div className="flex-1 truncate">
      <p className="font-medium truncate">{title}</p>
    </div>
    <Badge variant="secondary" className="text-xs shrink-0">{category}</Badge>
  </div>
);

const EmailItem = ({ subject, detail, confidence }: { subject: string; detail: string; confidence: string }) => (
  <div className="p-3 rounded-lg bg-secondary/50 border space-y-1">
    <div className="flex items-start justify-between gap-2">
      <p className="font-medium text-sm truncate">{subject}</p>
      <Badge variant={confidence === 'high' ? 'default' : 'secondary'} className="text-xs shrink-0">{confidence}</Badge>
    </div>
    <p className="text-sm text-muted-foreground truncate">{detail}</p>
  </div>
);

export default Dashboard;
