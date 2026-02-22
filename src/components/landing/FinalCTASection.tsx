import { Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { forwardRef } from "react";

const FinalCTASection = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  (props, ref) => {
    const navigate = useNavigate();

    return (
      <section ref={ref} className="py-28 px-4 relative overflow-hidden" {...props}>
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-primary/15 rounded-full blur-[150px]" />
        </div>

        <div className="container relative z-10 text-center max-w-2xl">
          {/* Logo icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary mb-8 shadow-lg shadow-primary/25">
            <Zap className="w-8 h-8 text-primary-foreground" />
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-5">
            Ready to Monetize Your Content?
          </h2>
          <p className="text-base text-muted-foreground mb-10 max-w-lg mx-auto">
            Join thousands of creators and brands already earning and collaborating through our platform.
          </p>

          <button
            onClick={() => navigate("/auth")}
            className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-primary text-primary-foreground font-medium text-base hover:opacity-90 transition-all shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40"
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
