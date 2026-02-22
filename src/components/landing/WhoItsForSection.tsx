import { BarChart3, Shield, Zap, DollarSign, TrendingUp, BookOpen } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const brandBenefits = [
  { icon: BarChart3, title: "Real-Time Analytics", desc: "Track views, clicks, and conversions live." },
  { icon: Shield, title: "Zero Risk", desc: "Only pay for performance — no upfront costs." },
  { icon: Zap, title: "Fast Matching", desc: "Get matched with the right creators instantly." },
];

const creatorBenefits = [
  { icon: DollarSign, title: "Get Paid Per View", desc: "Creators, streamers, and musicians earn for every 1,000 views." },
  { icon: TrendingUp, title: "Grow Your Audience", desc: "Access campaigns that match your niche and content style." },
  { icon: BookOpen, title: "Free Training", desc: "Expert guidance to help you succeed, no matter your platform." },
];

const WhoItsForSection = () => {
  const headerRef = useScrollReveal();
  const contentRef = useScrollReveal();

  return (
    <section id="features" className="py-24 sm:py-32 px-4 relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/3 rounded-full blur-[200px]" />
      </div>

      <div className="container relative max-w-5xl">
        <div ref={headerRef} className="scroll-reveal text-center mb-16">
          <span className="text-primary text-xs font-semibold tracking-[0.2em] uppercase mb-4 block">
            Why Choose Us
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Built for <span className="text-gradient">Everyone</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base">
            Whether you're a brand, creator, streamer, or musician — Amplify has you covered.
          </p>
        </div>

        <div ref={contentRef} className="scroll-reveal grid md:grid-cols-2 gap-0 md:gap-0 rounded-2xl border border-border/30 overflow-hidden bg-card/20 backdrop-blur-sm">
          {/* For Brands */}
          <div className="p-8 sm:p-10 md:border-r border-b md:border-b-0 border-border/20">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary" />
              </span>
              For Brands
            </h3>
            <div className="space-y-5">
              {brandBenefits.map((b) => (
                <div
                  key={b.title}
                  className="group flex items-start gap-4 p-3 -mx-3 rounded-xl transition-all duration-300 hover:bg-primary/5"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:bg-primary/20 group-hover:shadow-[0_0_15px_hsl(var(--primary)/0.2)]">
                    <b.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-0.5 group-hover:text-primary transition-colors">{b.title}</p>
                    <p className="text-xs text-muted-foreground">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Glowing divider - desktop only */}
          <div className="hidden md:block absolute left-1/2 top-[10%] bottom-[10%] w-px bg-gradient-to-b from-transparent via-primary/40 to-transparent -translate-x-1/2" />

          {/* For Creators */}
          <div className="p-8 sm:p-10 relative">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-primary" />
              </span>
              For Creators & Artists
            </h3>
            <div className="space-y-5">
              {creatorBenefits.map((b) => (
                <div
                  key={b.title}
                  className="group flex items-start gap-4 p-3 -mx-3 rounded-xl transition-all duration-300 hover:bg-primary/5"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:bg-primary/20 group-hover:shadow-[0_0_15px_hsl(var(--primary)/0.2)]">
                    <b.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-0.5 group-hover:text-primary transition-colors">{b.title}</p>
                    <p className="text-xs text-muted-foreground">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhoItsForSection;
