import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { forwardRef } from "react";

const FinalCTASection = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  (props, ref) => {
    const navigate = useNavigate();

    return (
      <section ref={ref} className="py-24 px-4 relative overflow-hidden bg-gradient-dark" {...props}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[600px] h-[300px] rounded-full bg-primary/10 blur-[120px]" />
        </div>

        <div className="container relative z-10 text-center max-w-2xl">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
            Ready to <span className="text-gradient-animated">Get Started?</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-10">
            Join thousands of brands and creators already growing with Amplify.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" variant="glow" className="w-full sm:w-auto text-lg px-8 py-6" onClick={() => navigate("/auth")}>
              Join as Creator
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="glow" className="w-full sm:w-auto text-lg px-8 py-6" onClick={() => navigate("/auth")}>
              Join as Brand
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

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
