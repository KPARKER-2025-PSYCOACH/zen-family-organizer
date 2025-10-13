import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Mail, UtensilsCrossed, Gift, Settings, Plus, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import logoImage from "@/assets/parent-assist-logo.png";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src={logoImage} 
                alt="Parent Assist logo" 
                className="h-12 w-auto"
              />
              <div>
                <h1 className="text-2xl font-bold">Parent Assist</h1>
                <p className="text-sm text-muted-foreground">The Smith Family</p>
              </div>
            </div>
            <Link to="/settings">
              <Button variant="outline" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Quick overview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold">Today's overview</h2>
            <p className="text-muted-foreground">Wednesday, 11 Oct 2025</p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickStat label="Events today" value="3" icon={<Calendar className="h-5 w-5" />} />
            <QuickStat label="Pending emails" value="2" icon={<Mail className="h-5 w-5" />} />
            <QuickStat label="Meals planned" value="5/7" icon={<UtensilsCrossed className="h-5 w-5" />} />
            <QuickStat label="Shopping items" value="12" icon={<Gift className="h-5 w-5" />} />
          </div>
        </div>

        {/* Main sections */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Calendar */}
          <DashboardCard
            icon={<Calendar className="h-6 w-6" />}
            title="Smart calendar"
            description="All your family events in one place"
            actionLabel="View calendar"
            actionHref="/calendar"
          >
            <div className="space-y-3 pt-4">
              <EventItem time="09:00" title="School drop-off" category="School" />
              <EventItem time="15:30" title="Dentist appointment" category="Health" />
              <EventItem time="18:00" title="Football practice" category="Activity" />
            </div>
          </DashboardCard>

          {/* Email parsing */}
          <DashboardCard
            icon={<Mail className="h-6 w-6" />}
            title="Email inbox"
            description="Events detected from your emails"
            actionLabel="Review emails"
            actionHref="/emails"
          >
            <div className="space-y-3 pt-4">
              <EmailItem 
                subject="School trip permission form" 
                detail="Thursday 18 Oct, 9am - needs approval"
                confidence="high"
              />
              <EmailItem 
                subject="Birthday party invitation" 
                detail="Saturday 20 Oct, 3pm"
                confidence="medium"
              />
            </div>
          </DashboardCard>

          {/* Meal planning */}
          <DashboardCard
            icon={<UtensilsCrossed className="h-6 w-6" />}
            title="Meal planner"
            description="This week's meals and shopping list"
            actionLabel="Plan meals"
            actionHref="/meals"
          >
            <div className="space-y-3 pt-4">
              <MealItem day="Wed" meal="Spaghetti bolognese" />
              <MealItem day="Thu" meal="Chicken stir-fry" />
              <MealItem day="Fri" meal="Fish & chips" />
            </div>
            <Button className="w-full mt-4">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Shop for all meals
            </Button>
          </DashboardCard>

          {/* Gift suggestions */}
          <DashboardCard
            icon={<Gift className="h-6 w-6" />}
            title="Gift ideas"
            description="Upcoming occasions and suggestions"
            actionLabel="Browse gifts"
            actionHref="/gifts"
          >
            <div className="space-y-3 pt-4">
              <GiftItem 
                occasion="Emma's birthday party" 
                date="Saturday 20 Oct"
                suggestion="Age 7 craft kit"
              />
              <GiftItem 
                occasion="Teacher appreciation" 
                date="Next month"
                suggestion="Thank you card bundle"
              />
            </div>
          </DashboardCard>
        </div>

        {/* Quick actions */}
        <Card className="border-2 border-dashed">
          <CardContent className="py-8">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
              <div className="text-center sm:text-left">
                <h3 className="font-semibold">Connect your first calendar</h3>
                <p className="text-sm text-muted-foreground">
                  Link Google, Apple, or Android to start seeing your events
                </p>
              </div>
              <Button className="sm:ml-auto">
                Connect calendar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const QuickStat = ({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) => (
  <Card className="shadow-soft">
    <CardContent className="pt-6">
      <div className="flex items-center gap-3">
        <div className="text-primary">{icon}</div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

const DashboardCard = ({ 
  icon, 
  title, 
  description, 
  actionLabel,
  actionHref,
  children 
}: { 
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  children: React.ReactNode;
}) => (
  <Card className="shadow-soft hover:shadow-glow transition-all">
    <CardHeader>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="text-primary">{icon}</div>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
        <Link to={actionHref}>
          <Button variant="ghost" size="sm">
            {actionLabel}
          </Button>
        </Link>
      </div>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

const EventItem = ({ time, title, category }: { time: string; title: string; category: string }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border">
    <div className="text-sm font-mono text-muted-foreground w-16">{time}</div>
    <div className="flex-1">
      <p className="font-medium">{title}</p>
    </div>
    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
      {category}
    </span>
  </div>
);

const EmailItem = ({ subject, detail, confidence }: { subject: string; detail: string; confidence: string }) => (
  <div className="p-3 rounded-lg bg-secondary/50 border space-y-1">
    <div className="flex items-start justify-between gap-2">
      <p className="font-medium text-sm">{subject}</p>
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
        confidence === 'high' ? 'bg-success/10 text-success' : 'bg-accent/10 text-accent'
      }`}>
        {confidence}
      </span>
    </div>
    <p className="text-sm text-muted-foreground">{detail}</p>
  </div>
);

const MealItem = ({ day, meal }: { day: string; meal: string }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border">
    <div className="text-sm font-medium text-muted-foreground w-12">{day}</div>
    <p className="font-medium">{meal}</p>
  </div>
);

const GiftItem = ({ occasion, date, suggestion }: { occasion: string; date: string; suggestion: string }) => (
  <div className="p-3 rounded-lg bg-secondary/50 border space-y-1">
    <div className="flex items-start justify-between gap-2">
      <p className="font-medium text-sm">{occasion}</p>
      <span className="text-xs text-muted-foreground">{date}</span>
    </div>
    <p className="text-sm text-muted-foreground">Suggested: {suggestion}</p>
  </div>
);

export default Dashboard;
