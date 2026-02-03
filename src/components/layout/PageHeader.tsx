import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backTo?: string;
  backLabel?: string;
  action?: React.ReactNode;
}

const PageHeader = ({ title, subtitle, backTo = "/dashboard", backLabel = "Back to Dashboard", action }: PageHeaderProps) => {
  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-[#f5f3f0] to-[#faf9f7] py-6 px-6">
      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(201,184,168,0.08)_0%,transparent_70%)] rounded-full" />
      
      <div className="container mx-auto relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={backTo}>
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                {backLabel}
              </Button>
            </Link>
          </div>
          {action}
        </div>
        
        <div className="mt-4 text-center">
          <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-[#c9b8a8] to-transparent mx-auto mb-3" />
          <h1 className="text-3xl font-normal text-foreground tracking-wide">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
