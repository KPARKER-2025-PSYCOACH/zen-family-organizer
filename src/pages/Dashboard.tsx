import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Mail, UtensilsCrossed, Gift, Settings, Plus, LogOut, PoundSterling, Users, CheckSquare, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format, isToday, isTomorrow, parseISO, addDays } from "date-fns";
import FamilyMembersSection from "@/components/family/FamilyMembersSection";
import { useFamilyMembers } from "@/hooks/useFamilyMembers";
import { useCalendarData, type CalendarEventRow } from "@/hooks/useCalendarData";
import { useSpendingData } from "@/hooks/useSpendingData";
import { useTodoData } from "@/hooks/useTodoData";
import { useMealData } from "@/hooks/useMealData";
import { supabase } from "@/integrations/supabase/client";
import calendarImage from "@/assets/calendar.jpg";
import emailImage from "@/assets/email.jpg";
import kitchenImage from "@/assets/kitchen.jpg";
import giftsImage from "@/assets/gifts.jpg";
import spendingImage from "@/assets/spending.jpg";
import tasksImage from "@/assets/tasks.jpg";
import todoImage from "@/assets/todo.jpg";

interface InboxEmail {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
}

interface TasksMember { id: string; name: string; tasks: { id: string; text: string; category: string; }[]; }

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const Dashboard = () => {
  const navigate = useNavigate();
  const { members, loading: membersLoading, addMember, updateMember, deleteMember } = useFamilyMembers();
  const { events, detectedEvents, fetchEvents, fetchDetectedEvents } = useCalendarData();
  const { grandTotal, totalByCategory } = useSpendingData(new Date().getFullYear());
  const { lists: todoLists, addItem, toggleItem, deleteItem } = useTodoData();
  const { mealPlan: plannedMeals } = useMealData();
  const [inboxEmails, setInboxEmails] = useState<InboxEmail[]>([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [taskMembers, setTaskMembers] = useState<TasksMember[]>([]);
  const [newTodoText, setNewTodoText] = useState("");

  useEffect(() => {
    fetchEvents();
    fetchDetectedEvents();
    fetchInbox();
    try {
      const raw = localStorage.getItem("parentassist_family_tasks");
      if (raw) {
        const state = JSON.parse(raw);
        if (state.members) setTaskMembers(state.members);
      }
    } catch {}
  }, [fetchEvents, fetchDetectedEvents]);

  const fetchInbox = async () => {
    setInboxLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await supabase.functions.invoke("scan-emails", {
        body: { action: "fetch_inbox" },
      });
      if (res.data?.emails) {
        setInboxEmails(res.data.emails);
      }
    } catch (err) {
      console.error("Failed to fetch inbox:", err);
    } finally {
      setInboxLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // Upcoming events
  const upcomingEvents = events
    .filter(e => {
      const start = parseISO(e.start_time);
      return start >= new Date() || isToday(start);
    })
    .slice(0, 4);

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

  // Computed summaries
  const starredList = todoLists.find(l => l.starred);
  const starredPending = starredList ? starredList.items.filter(i => !i.completed) : [];
  const totalTodoItems = todoLists.reduce((sum, l) => sum + l.items.filter(i => !i.completed).length, 0);
  const totalAssignedTasks = taskMembers.reduce((sum, m) => sum + m.tasks.length, 0);
  const topCategories = totalByCategory.filter(c => c.total > 0).sort((a, b) => b.total - a.total).slice(0, 3);

  // Next 3 days meal planner
  const today = new Date();
  const todayDayIndex = (today.getDay() + 6) % 7; // Monday=0
  const next3Days = [0, 1, 2].map(offset => {
    const dayIndex = (todayDayIndex + offset) % 7;
    return DAYS_OF_WEEK[dayIndex];
  });
  const totalMealsPlanned = Object.values(plannedMeals).reduce((sum, meals) => sum + meals.length, 0);

  const handleAddTodoItem = () => {
    if (!starredList || !newTodoText.trim()) return;
    addItem(starredList.id, newTodoText.trim());
    setNewTodoText("");
  };

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

        {/* Top row: Calendar, Email, To-do — 3 columns */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <DashboardCard
            icon={<Calendar className="h-6 w-6" />}
            title="Smart calendar"
            description="All your family events in one place"
            actionLabel="View calendar"
            actionHref="/calendar"
            backgroundImage={calendarImage}
            tintColor="hsla(140, 40%, 80%, 0.25)"
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

          {/* Email inbox */}
          <DashboardCard
            icon={<Mail className="h-6 w-6" />}
            title="Email inbox"
            description="Latest emails from your primary inbox"
            actionLabel="Review emails"
            actionHref="/emails"
            backgroundImage={emailImage}
            tintColor="hsla(210, 50%, 82%, 0.25)"
          >
            {inboxEmails.length === 0 ? (
              <div className="pt-4 text-center py-8">
                <p className="text-muted-foreground">
                  {inboxLoading ? "Loading inbox..." : "No emails to show"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Connect your Gmail to see your latest messages</p>
              </div>
            ) : (
              <div className="pt-2 space-y-2">
                {inboxEmails.map(email => (
                  <InboxItem
                    key={email.id}
                    subject={email.subject}
                    from={email.from}
                    snippet={email.snippet}
                  />
                ))}
              </div>
            )}
          </DashboardCard>

          {/* To-do list - now editable */}
          <DashboardCard
            icon={<CheckSquare className="h-6 w-6" />}
            title="To do list"
            description="Your tasks and reminders"
            actionLabel="View lists"
            actionHref="/todos"
            backgroundImage={todoImage}
            tintColor="hsla(45, 60%, 82%, 0.25)"
          >
            {todoLists.length === 0 ? (
              <div className="pt-4 text-center py-8">
                <p className="text-muted-foreground">No to-do lists yet</p>
                <p className="text-sm text-muted-foreground mt-1">Create a list to start tracking tasks</p>
              </div>
            ) : starredList ? (
              <div className="pt-2 space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <p className="font-medium text-sm">{starredList.name}</p>
                </div>
                {starredPending.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">All done! 🎉</p>
                ) : (
                  starredPending.slice(0, 5).map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50 border">
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={() => toggleItem(starredList.id, item.id)}
                      />
                      <span className="text-sm truncate flex-1">{item.text}</span>
                    </div>
                  ))
                )}
                {starredPending.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">+{starredPending.length - 5} more</p>
                )}
                {/* Add item inline */}
                <form onSubmit={e => { e.preventDefault(); handleAddTodoItem(); }} className="flex gap-2 pt-1">
                  <Input
                    placeholder="Add item…"
                    value={newTodoText}
                    onChange={e => setNewTodoText(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Button type="submit" size="sm" variant="secondary" className="h-8" disabled={!newTodoText.trim()}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </form>
                <Link to="/todos" className="block text-sm text-primary hover:underline text-center pt-1">
                  View all lists →
                </Link>
              </div>
            ) : (
              <div className="pt-2 space-y-2">
                <p className="text-sm text-muted-foreground text-center py-2">
                  Star a list to see its items here
                </p>
                {todoLists.slice(0, 3).map(list => {
                  const pending = list.items.filter(i => !i.completed).length;
                  const done = list.items.filter(i => i.completed).length;
                  return (
                    <div key={list.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border">
                      <p className="font-medium text-sm truncate">{list.name}</p>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        {pending > 0 && <span>{pending} pending</span>}
                        {done > 0 && <span className="text-success">{done} done</span>}
                      </div>
                    </div>
                  );
                })}
                <Link to="/todos" className="block text-sm text-primary hover:underline text-center pt-1">
                  {totalTodoItems} items remaining →
                </Link>
              </div>
            )}
          </DashboardCard>
        </div>

        {/* Bottom rows: 2 columns — Meals/Tasks then Spending/Gifts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Meal planning - next 3 days */}
          <DashboardCard
            icon={<UtensilsCrossed className="h-6 w-6" />}
            title="Meal planner"
            description="Next 3 days at a glance"
            actionLabel="Plan meals"
            actionHref="/meals"
            backgroundImage={kitchenImage}
            tintColor="hsla(50, 60%, 82%, 0.25)"
          >
            {totalMealsPlanned === 0 ? (
              <div className="pt-4 text-center py-8">
                <p className="text-muted-foreground">No meals planned</p>
                <p className="text-sm text-muted-foreground mt-1">Start planning your week</p>
              </div>
            ) : (
              <div className="pt-2 space-y-2">
                {next3Days.map(day => {
                  const meals = plannedMeals[day] || [];
                  return (
                    <div key={day} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border">
                      <span className="text-sm font-medium w-24 shrink-0">{day}</span>
                      <span className="text-sm text-muted-foreground truncate">
                        {meals.length > 0 ? meals.map(m => m.name).join(", ") : "No meals planned"}
                      </span>
                    </div>
                  );
                })}
                <Link to="/meals" className="block text-sm text-primary hover:underline text-center pt-1">
                  {totalMealsPlanned} meals planned →
                </Link>
              </div>
            )}
          </DashboardCard>

          {/* Balance Family Tasks */}
          <DashboardCard
            icon={<Users className="h-6 w-6" />}
            title="Balance family tasks"
            description="Assign and share household responsibilities"
            actionLabel="Manage tasks"
            actionHref="/tasks"
            backgroundImage={tasksImage}
            tintColor="hsla(270, 40%, 85%, 0.25)"
          >
            {totalAssignedTasks === 0 ? (
              <div className="pt-4 text-center py-8">
                <p className="text-muted-foreground">No tasks assigned yet</p>
                <p className="text-sm text-muted-foreground mt-1">Add family members and drag tasks to get started</p>
              </div>
            ) : (
              <div className="pt-2 space-y-2">
                {taskMembers.filter(m => m.tasks.length > 0).slice(0, 3).map(member => (
                  <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border">
                    <p className="font-medium text-sm truncate">{member.name}</p>
                    <Badge variant="secondary" className="text-xs">{member.tasks.length} tasks</Badge>
                  </div>
                ))}
                <Link to="/tasks" className="block text-sm text-primary hover:underline text-center pt-1">
                  {totalAssignedTasks} tasks assigned →
                </Link>
              </div>
            )}
          </DashboardCard>

          {/* Family Spending */}
          <DashboardCard
            icon={<PoundSterling className="h-6 w-6" />}
            title="Track spending"
            description="Track your household spending"
            actionLabel="View spending"
            actionHref="/spending"
            backgroundImage={spendingImage}
            tintColor="hsla(25, 60%, 82%, 0.25)"
          >
            {grandTotal === 0 ? (
              <div className="pt-4 text-center py-8">
                <p className="text-muted-foreground">No spending recorded yet</p>
                <p className="text-sm text-muted-foreground mt-1">Start tracking your household budget</p>
              </div>
            ) : (
              <div className="pt-2 space-y-2">
                <div className="p-3 rounded-lg bg-secondary/50 border text-center">
                  <p className="text-2xl font-semibold">£{grandTotal.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Total this year</p>
                </div>
                {topCategories.map(({ category, total }) => (
                  <div key={category} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border">
                    <p className="text-sm truncate">{category}</p>
                    <p className="text-sm font-medium">£{total.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
          </DashboardCard>

          {/* Gift suggestions */}
          <DashboardCard
            icon={<Gift className="h-6 w-6" />}
            title="Gift ideas"
            description="Upcoming occasions and suggestions"
            actionLabel="Browse gifts"
            actionHref="/gifts"
            backgroundImage={giftsImage}
            tintColor="hsla(340, 40%, 85%, 0.25)"
          >
            <div className="pt-4 text-center py-8">
              <p className="text-muted-foreground">No upcoming occasions</p>
              <p className="text-sm text-muted-foreground mt-1">Add events to get gift suggestions</p>
            </div>
          </DashboardCard>
        </div>
      </div>
    </div>
  );
};

const DashboardCard = ({ 
  icon, title, description, actionLabel, actionHref, backgroundImage, tintColor, children 
}: { 
  icon: React.ReactNode; title: string; description: string; actionLabel: string; actionHref: string; backgroundImage?: string; tintColor?: string; children: React.ReactNode;
}) => (
  <Card className="relative overflow-hidden shadow-soft hover:shadow-glow transition-all">
    {backgroundImage && (
      <>
        <div className="absolute inset-0 bg-cover bg-center opacity-25" style={{ backgroundImage: `url(${backgroundImage})` }} />
        <div className="absolute inset-0 bg-gradient-to-br from-card/70 to-card/90" />
      </>
    )}
    {tintColor && (
      <div className="absolute inset-0" style={{ backgroundColor: tintColor }} />
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

const InboxItem = ({ subject, from, snippet }: { subject: string; from: string; snippet: string }) => {
  const senderName = from.replace(/<[^>]+>/, "").trim() || from;
  return (
    <div className="p-3 rounded-lg bg-secondary/50 border space-y-1">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-sm truncate flex-1">{subject}</p>
      </div>
      <p className="text-xs text-muted-foreground truncate">{senderName}</p>
      <p className="text-xs text-muted-foreground/70 truncate">{snippet}</p>
    </div>
  );
};

export default Dashboard;
