import { Button } from "@/components/ui/button";
import { Calendar, Mail, UtensilsCrossed, Gift, CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-family.jpg";

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-soft">
        <div className="container mx-auto px-4 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-block">
                <span className="text-sm font-medium text-primary bg-primary/10 px-4 py-2 rounded-full">
                  You plan the moments, we'll tidy the details
                </span>
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold text-balance leading-tight">
                Make family logistics feel{" "}
                <span className="gradient-primary bg-clip-text text-transparent">lighter</span>
              </h1>
              <p className="text-xl text-muted-foreground text-balance">
                From inbox to calendar, done. Meals sorted, list ready, day saved. One smart hub for everything that keeps your family running.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/onboarding">
                  <Button size="lg" className="w-full sm:w-auto shadow-soft hover:shadow-glow transition-all">
                    Get started free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    View demo
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-glow">
                <img 
                  src={heroImage} 
                  alt="Organised family kitchen with calendar and meal planning" 
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl lg:text-5xl font-bold">Everything in one place</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              No more juggling apps, missed appointments, or last-minute scrambles.
            </p>
          </div>

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

      {/* How it works */}
      <section className="py-20 lg:py-32 gradient-soft">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl lg:text-5xl font-bold">We've got this</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Set up in minutes. See results immediately.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            <Step
              number={1}
              title="Connect your calendars"
              description="Link Google, Apple, or Android calendars in two minutes. We'll explain every permission in plain language."
            />
            <Step
              number={2}
              title="Let us scan your inbox"
              description="With your consent, we'll find dates and appointments. You approve what matters, we'll handle the rest."
            />
            <Step
              number={3}
              title="Plan meals & shopping"
              description="Save recipes, plan your week, generate lists. Done in five minutes, saves you hours."
            />
            <Step
              number={4}
              title="Never miss a moment"
              description="Gentle reminders for what's coming up. Gift ideas when you need them. One less thing to remember."
            />
          </div>
        </div>
      </section>

      {/* Trust & Privacy */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl lg:text-5xl font-bold">Your data, your control</h2>
            <p className="text-xl text-muted-foreground">
              We'll never create events without your approval. We'll never send emails. We'll never make purchases on your behalf. Clear consent screens, easy toggles, full data export and deletion.
            </p>
            <div className="grid sm:grid-cols-3 gap-8 pt-8">
              <TrustBadge icon={<CheckCircle2 className="h-6 w-6" />} text="GDPR compliant" />
              <TrustBadge icon={<CheckCircle2 className="h-6 w-6" />} text="End-to-end encrypted" />
              <TrustBadge icon={<CheckCircle2 className="h-6 w-6" />} text="You own your data" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-32 gradient-primary">
        <div className="container mx-auto px-4 text-center space-y-8">
          <h2 className="text-3xl lg:text-5xl font-bold text-primary-foreground">
            Day saved. Let's go.
          </h2>
          <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
            Start making family logistics feel lighter. Free to try, no credit card required.
          </p>
          <Link to="/onboarding">
            <Button size="lg" variant="secondary" className="shadow-soft hover:shadow-glow transition-all">
              Start organising now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
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

const Step = ({ number, title, description }: { number: number; title: string; description: string }) => (
  <div className="flex gap-6 items-start">
    <div className="flex-shrink-0 w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-xl shadow-soft">
      {number}
    </div>
    <div className="space-y-2 flex-1">
      <h3 className="text-2xl font-semibold">{title}</h3>
      <p className="text-muted-foreground text-lg">{description}</p>
    </div>
  </div>
);

const TrustBadge = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div className="flex flex-col items-center gap-2">
    <div className="text-success">{icon}</div>
    <p className="font-medium">{text}</p>
  </div>
);

export default Index;
