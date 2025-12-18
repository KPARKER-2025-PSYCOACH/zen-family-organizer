import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import logoImage from "@/assets/parent-assist-logo-transparent.png";
import calendarImage from "@/assets/calendar.jpg";
import emailImage from "@/assets/email.jpg";
import kitchenImage from "@/assets/kitchen.jpg";
import giftsImage from "@/assets/gifts.jpg";

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="gradient-warm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center sm:flex-row sm:items-center gap-4 sm:gap-6">
              <img 
                src={logoImage} 
                alt="Parent Assist logo - AI that lightens your mental load" 
                className="h-20 sm:h-24 w-auto"
              />
              <p className="text-xl sm:text-2xl lg:text-3xl font-medium text-foreground text-center sm:text-left">
                AI that lightens your mental load.
              </p>
            </div>
            <div className="flex gap-3">
              <Link to="/onboarding">
                <Button variant="outline" size="default">
                  Log in
                </Button>
              </Link>
              <Link to="/onboarding">
                <Button size="default">
                  Register
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Intro Section */}
      <section className="pt-12 pb-6 lg:pt-16 lg:pb-8">
        <div className="container mx-auto px-4">
          <div className="bg-card rounded-2xl p-8 lg:p-10 shadow-soft border space-y-4">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground text-center">
              Family life, made lighter
            </h2>
            <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed text-center">
              From scattered calendars to sorted meals, Parent Assist brings everything together. 
              One gentle hub that scans your inbox, plans your week, and reminds you what matters—so 
              you can spend less time juggling and more time with the people you love.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="pt-6 pb-12 lg:pt-8 lg:pb-16 gradient-soft">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              image={calendarImage}
              title="Smart calendar"
              description="Sync Google, Apple, and Android calendars. Events auto-categorised, colour-coded, and shared."
            />
            <FeatureCard
              image={emailImage}
              imagePosition="bottom"
              title="Email parsing"
              description="Scans your inbox for dates and times. One tap approval adds them to your calendar."
            />
            <FeatureCard
              image={kitchenImage}
              title="Meal planning"
              description="Save favourite recipes, plan your week, and generate shopping lists instantly."
            />
            <FeatureCard
              image={giftsImage}
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

const FeatureCard = ({ image, imagePosition = "center", title, description }: { image: string; imagePosition?: "center" | "top" | "bottom"; title: string; description: string }) => (
  <div className="relative rounded-2xl overflow-hidden shadow-soft hover:shadow-glow transition-all border min-h-[280px]">
    {/* Background image with fade overlay */}
    <div 
      className={`absolute inset-0 bg-cover ${imagePosition === "bottom" ? "bg-bottom" : imagePosition === "top" ? "bg-top" : "bg-center"}`}
      style={{ backgroundImage: `url(${image})` }}
    />
    <div className="absolute inset-0 bg-gradient-to-t from-card/95 via-card/80 to-card/50" />
    
    {/* Content */}
    <div className="relative z-10 p-8 h-full flex flex-col justify-end space-y-3">
      <h3 className="text-xl font-semibold text-foreground">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  </div>
);

export default Index;
