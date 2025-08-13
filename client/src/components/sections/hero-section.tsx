import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <div className="text-center py-12">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl font-bold text-slate-900 sm:text-5xl" data-testid="hero-title">
          Hello World!
        </h2>
        <p className="mt-4 text-xl text-slate-600" data-testid="hero-description">
          Your development environment is ready. Start building something amazing.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            className="inline-flex items-center px-6 py-3 text-base font-medium"
            data-testid="button-get-started"
          >
            Get Started
            <ArrowRight className="ml-2 -mr-1 w-5 h-5" />
          </Button>
          <Button 
            variant="outline"
            className="inline-flex items-center px-6 py-3 text-base font-medium"
            data-testid="button-view-docs"
          >
            View Documentation
          </Button>
        </div>
      </div>
    </div>
  );
}
