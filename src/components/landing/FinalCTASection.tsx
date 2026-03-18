import { useNavigate } from "react-router-dom";
import { forwardRef } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const FinalCTASection = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  (props, ref) => {
    const navigate = useNavigate();
    const revealRef = useScrollReveal();

    return (
      <section ref={ref} className="py-24 sm:py-32 px-4 relative overflow-hidden" {...props}>
        <div className="container relative z-10 max-w-4xl">
          <div
            ref={revealRef}
            className="scroll-reveal cta-gradient rounded-3xl p-10 sm:p-16 text-center relative overflow-hidden border border-primary/20"
          >
            {/* Dot grid overlay */}
            <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />

            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                Start Growing Today
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-10 max-w-md mx-auto">
                Join thousands of creators, streamers, musicians, and brands already earning and collaborating on Amplify.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => navigate("/auth")}
                  className="btn-shimmer w-full sm:w-auto px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-medium text-sm transition-all duration-300 hover:scale-105 active:scale-[0.98] shadow-[0_0_25px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_40px_hsl(var(--primary)/0.6)] pulse-glow"
                >
                  I'm a Creator →
                </button>
                <button
                  onClick={() => navigate("/brand-application")}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-full border border-primary/40 text-foreground font-medium text-sm transition-all duration-300 hover:border-primary/70 hover:shadow-[0_0_20px_hsl(var(--primary)/0.2)] hover:scale-105 active:scale-[0.98]"
                >
                  I'm a Brand →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
);

FinalCTASection.displayName = "FinalCTASection";

export default FinalCTASection;
