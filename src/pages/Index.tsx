import { Button } from "@/components/ui/button";
import { Calendar, Mail, UtensilsCrossed, Gift } from "lucide-react";
import { Link } from "react-router-dom";
import logoImage from "@/assets/parent-assist-logo.png";

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center sm:flex-row sm:items-center gap-3 sm:gap-4">
              <img 
                src={logoImage} 
                alt="Parent Assist logo - AI that lightens your mental load" 
                className="h-16 w-auto"
              />
              <p className="text-sm sm:text-base text-muted-foreground text-center sm:text-left">
                AI that lightens your mental load.
              </p>
            </div>
            <div className="flex gap-3">
              <Link to="/onboarding">
                <Button variant="outline" size="sm">
                  Log in
                </Button>
              </Link>
              <Link to="/onboarding">
                <Button size="sm">
                  Register
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Calendar className="h-8 w-8" />}
              title="Smart calendar"
              description="Sync Google, Apple, and Android calendars. Events auto-categorised, colour-coded, and shared."
            />
            <FeatureCard
              icon={<Mail className="h-8 w-8" />}
              title="Email parsing"
              description="Scans your inbox for dates and times. One tap approval adds them to your calendar."
            />
            <FeatureCard
              icon={<UtensilsCrossed className="h-8 w-8" />}
              title="Meal planning"
              description="Save favourite recipes, plan your week, and generate shopping lists instantly."
            />
            <FeatureCard
              icon={<Gift className="h-8 w-8" />}
              title="Gift suggestions"
              description="Timely reminders and thoughtful gift ideas based on upcoming events."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 Parent Assist. Made with care for busy parents everywhere.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="bg-card rounded-2xl p-8 shadow-soft hover:shadow-glow transition-all border space-y-4">
    <div className="text-primary">{icon}</div>
    <h3 className="text-xl font-semibold">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

export default Index;
