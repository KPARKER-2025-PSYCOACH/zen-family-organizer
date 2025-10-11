import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [familyName, setFamilyName] = useState("");
  const [timezone, setTimezone] = useState("");

  const handleContinue = () => {
    if (step === 1) {
      if (!familyName.trim()) {
        toast.error("Please enter your family name");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!timezone) {
        toast.error("Please select your timezone");
        return;
      }
      toast.success("Welcome to Parent Assist! Let's get organised.");
      navigate("/dashboard");
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen gradient-soft flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl lg:text-4xl font-bold">Welcome to Parent Assist</h1>
          <p className="text-muted-foreground">Let's get to know your family</p>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center gap-2">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-2 w-16 rounded-full transition-all ${
                s === step ? "gradient-primary" : s < step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <Card className="shadow-glow border-2">
          <CardHeader>
            <CardTitle>
              {step === 1 && "About your family"}
              {step === 2 && "Time and location"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "We'll use this to personalise your experience"}
              {step === 2 && "So we can show times that make sense for you"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 && (
              <div className="space-y-2">
                <Label htmlFor="familyName">Family name</Label>
                <Input
                  id="familyName"
                  placeholder="The Smiths"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  className="text-lg"
                />
                <p className="text-sm text-muted-foreground">
                  This is just for your reference - we'll show it on your dashboard
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger id="timezone" className="text-lg">
                    <SelectValue placeholder="Select your timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Europe/London">London (GMT/BST)</SelectItem>
                    <SelectItem value="Europe/Paris">Paris (CET/CEST)</SelectItem>
                    <SelectItem value="America/New_York">New York (EST/EDT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Los Angeles (PST/PDT)</SelectItem>
                    <SelectItem value="Australia/Sydney">Sydney (AEST/AEDT)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  All times will be shown in this timezone
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              {step > 1 && (
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  Back
                </Button>
              )}
              <Button onClick={handleContinue} className="flex-1">
                {step === 2 ? "Finish setup" : "Continue"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
