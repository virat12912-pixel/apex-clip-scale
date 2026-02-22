import { useState, useEffect } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const testimonials = [
  {
    quote: "I quit my 9-to-5 after just 3 campaigns. Amplify changed my life.",
    name: "Alex R.",
    role: "Full-Time Creator",
    earnings: "$4,200",
  },
  {
    quote: "Made $1,000 in my first week. I'm only 15 — this is insane.",
    name: "Jordan M.",
    role: "Student Creator",
    earnings: "$1,000",
  },
  {
    quote: "We 10x'd our brand awareness for a fraction of traditional ad spend.",
    name: "Sarah K.",
    role: "Marketing Lead, TechVibe",
    earnings: "10x ROI",
  },
  {
    quote: "The payout speed is unmatched. I get paid within 24 hours every time.",
    name: "Chris D.",
    role: "Content Creator",
    earnings: "$2,800",
  },
  {
    quote: "Amplify's matching system sent us creators that actually fit our brand.",
    name: "Lisa W.",
    role: "Founder, GlowUp Co",
    earnings: "3x CTR",
  },
];

const TestimonialsSection = () => {
  const [active, setActive] = useState(0);
  const headerRef = useScrollReveal();
  const cardRef = useScrollReveal();

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const t = testimonials[active];

  return (
    <section id="testimonials" className="py-24 sm:py-32 px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
      </div>

      <div className="container relative max-w-2xl">
        <div ref={headerRef} className="scroll-reveal text-center mb-14">
          <span className="text-primary text-xs font-semibold tracking-[0.2em] uppercase mb-4 block">
            Success Stories
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Real Results, <span className="text-gradient">Real People</span>
          </h2>
        </div>

        <div ref={cardRef} className="scroll-reveal">
          {/* Testimonial card */}
          <div className="relative rounded-2xl border border-border/30 bg-card/30 backdrop-blur-sm p-8 sm:p-10 text-center min-h-[260px] flex flex-col items-center justify-center">
            <div key={active} className="crossfade-enter">
              <p className="text-lg sm:text-xl font-medium text-foreground leading-relaxed mb-6 max-w-md mx-auto">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mb-4">
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
              <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <span className="text-sm font-bold text-primary">{t.earnings}</span>
              </div>
            </div>
          </div>

          {/* Dots navigation */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === active
                    ? "bg-primary w-6 shadow-[0_0_10px_hsl(var(--primary)/0.5)]"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
