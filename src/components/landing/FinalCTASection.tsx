import { Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { forwardRef } from "react";

const FinalCTASection = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  (props, ref) => {
    const navigate = useNavigate();

    return (
      <section ref={ref} className="py-24 sm:py-32 px-4 relative overflow-hidden" {...props}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/10 rounded-full blur-[180px]" />
        </div>

        <div className="container relative z-10 text-center max-w-2xl">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-primary mb-8 shadow-[0_0_30px_hsl(var(--primary)/0.3)]">
            <Zap className="w-7 h-7 text-primary-foreground" />
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Ready to Monetize Your Content?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-10 max-w-md mx-auto">
            Join thousands of creators and brands already earning and collaborating through our platform.
          </p>

          <button
            onClick={() => navigate("/auth")}
            className="inline-flex items-center gap-2 px-10 py-3.5 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all shadow-[0_0_25px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_40px_hsl(var(--primary)/0.5)]"
          >
            Get Started →
          </button>
        </div>
      </section>
    );
  }
);

FinalCTASection.displayName = "FinalCTASection";

export default FinalCTASection;
