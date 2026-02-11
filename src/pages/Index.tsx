import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import calendarImage from "@/assets/calendar.jpg";
import emailImage from "@/assets/email.jpg";
import kitchenImage from "@/assets/kitchen.jpg";
import giftsImage from "@/assets/gifts.jpg";

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Banner */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#f5f3f0] to-[#faf9f7] rounded-b-lg py-6 sm:py-12 px-4 sm:px-24">
        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(201,184,168,0.08)_0%,transparent_70%)] rounded-full" />
        
        {/* Navigation buttons - positioned at top on desktop, part of flow on mobile */}
        <div className="relative z-10 flex justify-end gap-2 sm:gap-3 mb-6 sm:mb-0 sm:absolute sm:top-6 sm:right-6">
          <Link to="/auth">
            <Button variant="outline" size="sm" className="sm:size-default">
              Log in
            </Button>
          </Link>
          <Link to="/auth">
            <Button size="sm" className="sm:size-default">
              Register
            </Button>
          </Link>
        </div>

        {/* Logo content */}
        <div className="relative z-[2] flex flex-col items-center text-center">
          <h1 className="text-4xl sm:text-[52px] font-normal text-[#2d2d2d] tracking-wide mb-3">Parent Assist</h1>
          <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#c9b8a8] to-transparent mb-5" />
          <p className="text-[11px] sm:text-[13px] text-[#8a8a8a] font-light tracking-[0.15em] uppercase">AI that helps you lighten the mental load</p>
        </div>
      </header>

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
    <div className="absolute inset-0 bg-gradient-to-t from-card/85 via-card/70 to-card/40" />
    
    {/* Content */}
    <div className="relative z-10 p-8 h-full flex flex-col justify-end space-y-3">
      <h3 className="text-xl font-semibold text-foreground">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  </div>
);

export default Index;
