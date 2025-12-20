import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { forwardRef } from "react";

const FinalCTASection = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  (props, ref) => {
    const navigate = useNavigate();

    return (
      <section ref={ref} className="py-24 px-4 relative overflow-hidden" {...props}>
        {/* Background glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[800px] h-[400px] rounded-full bg-primary/10 blur-[120px]" />
        </div>

        <div className="container relative z-10 text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
            Ready to <span className="text-gradient">Scale Your Content?</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
            Join thousands of creators and clippers already growing with Apex. 
            Start your journey today.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="w-full sm:w-auto bg-gradient-primary hover:opacity-90 transition-opacity text-lg px-8 py-6 glow-primary" onClick={() => navigate("/auth")}>
              Get Paid to Clip
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 border-border hover:bg-secondary" onClick={() => navigate("/auth")}>
              <Play className="mr-2 h-5 w-5" />
              Launch a Campaign
            </Button>
          </div>

          {/* Footer note */}
          <p className="mt-10 text-sm text-muted-foreground">
            No credit card required. Get started in under 2 minutes.
          </p>
        </div>
      </section>
    );
  }
);

FinalCTASection.displayName = "FinalCTASection";

export default FinalCTASection;
