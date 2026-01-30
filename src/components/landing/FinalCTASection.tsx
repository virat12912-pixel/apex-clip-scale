import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Shield, Clock, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { forwardRef } from "react";

const FinalCTASection = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  (props, ref) => {
    const navigate = useNavigate();

    return (
      <section ref={ref} className="py-24 px-4 relative overflow-hidden" {...props}>
        {/* Background glow - Enhanced */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[800px] h-[400px] rounded-full bg-primary/15 blur-[120px] pulse-glow" />
        </div>
        
        {/* Secondary orbs */}
        <div className="absolute top-1/3 left-1/4 w-48 h-48 bg-primary/10 rounded-full blur-3xl float" />
        <div className="absolute bottom-1/3 right-1/4 w-32 h-32 bg-primary/5 rounded-full blur-2xl float" style={{ animationDelay: '2s' }} />

        <div className="container relative z-10 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
            Ready to <span className="text-gradient-animated">Amplify Your Content?</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
            Join hundreds of brands and thousands of clippers already growing with Amplify. 
            Start your campaign today.
          </p>

          {/* CTA Buttons - Using new glow variant */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" variant="glow" className="w-full sm:w-auto text-lg px-8 py-6" onClick={() => navigate("/auth")}>
              Start a Campaign
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 border-border hover:bg-secondary hover:border-primary/30 transition-all duration-300" onClick={() => navigate("/auth")}>
              <Play className="mr-2 h-5 w-5" />
              Join as Clipper
            </Button>
          </div>

          {/* Trust signals - Enhanced with icon animations */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 group">
              <Shield className="w-4 h-4 text-primary icon-interactive" />
              <span>Full approval control</span>
            </div>
            <div className="flex items-center gap-2 group">
              <Clock className="w-4 h-4 text-primary icon-interactive" />
              <span>24hr response SLA</span>
            </div>
            <div className="flex items-center gap-2 group">
              <FileText className="w-4 h-4 text-primary icon-interactive" />
              <span>Transparent reporting</span>
            </div>
          </div>

          {/* Footer note */}
          <p className="mt-10 text-sm text-muted-foreground">
            No guaranteed views or sales. Budget-based pricing with full transparency.
          </p>
        </div>
      </section>
    );
  }
);

FinalCTASection.displayName = "FinalCTASection";

export default FinalCTASection;
