import { UserPlus, Search, Film, DollarSign } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const steps = [
  {
    icon: UserPlus,
    title: "Sign Up Free",
    description: "Create your account in seconds. Choose creator or brand — no fees, no commitments.",
  },
  {
    icon: Search,
    title: "Browse Campaigns",
    description: "Discover paid campaigns from brands looking for creators like you. Filter by niche and budget.",
  },
  {
    icon: Film,
    title: "Create & Post",
    description: "Make content your way. Post brand-approved assets or use your own creative style.",
  },
  {
    icon: DollarSign,
    title: "Get Paid",
    description: "Earn for every 1,000 views. Track earnings in real-time and withdraw anytime.",
  },
];

const TimelineStep = ({ step, index }: { step: typeof steps[0]; index: number }) => {
  const ref = useScrollReveal();
  const isEven = index % 2 === 0;

  return (
    <div ref={ref} className="scroll-reveal relative flex items-center gap-6 md:gap-10">
      {/* Desktop: alternating layout */}
      <div className={`hidden md:flex items-center w-full ${isEven ? "" : "flex-row-reverse"}`}>
        {/* Content card */}
        <div className={`flex-1 ${isEven ? "text-right pr-10" : "text-left pl-10"}`}>
          <div
            className={`inline-block rounded-2xl border border-border/40 bg-card/40 p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_30px_hsl(var(--primary)/0.1)] hover:-translate-y-1 backdrop-blur-sm ${
              isEven ? "ml-auto" : "mr-auto"
            }`}
          >
            <step.icon className="w-5 h-5 text-primary mb-3" />
            <h3 className="text-lg font-bold mb-2">{step.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{step.description}</p>
          </div>
        </div>

        {/* Center timeline dot */}
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center timeline-dot">
            <span className="text-xs font-bold text-primary">{index + 1}</span>
          </div>
        </div>

        {/* Empty spacer */}
        <div className="flex-1" />
      </div>

      {/* Mobile: simple layout */}
      <div className="md:hidden flex items-start gap-4 w-full">
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center timeline-dot">
            <span className="text-xs font-bold text-primary">{index + 1}</span>
          </div>
        </div>
        <div className="flex-1 pb-8">
          <step.icon className="w-5 h-5 text-primary mb-2" />
          <h3 className="text-base font-bold mb-1.5">{step.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
        </div>
      </div>
    </div>
  );
};

const HowItWorksSection = () => {
  const headerRef = useScrollReveal();

  return (
    <section id="how-it-works" className="py-24 sm:py-32 px-4 relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
      </div>

      <div className="container relative max-w-4xl">
        <div ref={headerRef} className="scroll-reveal text-center mb-20">
          <span className="text-primary text-xs font-semibold tracking-[0.2em] uppercase mb-4 block">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Start Earning in <span className="text-gradient">4 Steps</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base">
            From signup to payout — it's simple, fast, and free.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line - desktop */}
          <div className="hidden md:block absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px timeline-line" />
          {/* Vertical line - mobile */}
          <div className="md:hidden absolute left-5 top-0 bottom-0 w-px timeline-line" />

          <div className="space-y-8 md:space-y-12">
            {steps.map((step, i) => (
              <TimelineStep key={step.title} step={step} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
