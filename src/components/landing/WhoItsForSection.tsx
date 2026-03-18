import { BarChart3, Shield, Zap, DollarSign, TrendingUp, BookOpen } from "lucide-react";
import { useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const brandBenefits = [
  { icon: BarChart3, title: "Real-Time Analytics", desc: "Track views, clicks, and conversions live." },
  { icon: Shield, title: "Pay for Performance", desc: "Only pay when creators deliver real results." },
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
  const [activeTab, setActiveTab] = useState<"creators" | "brands">("creators");

  const benefits = activeTab === "creators" ? creatorBenefits : brandBenefits;
  const tabIcon = activeTab === "creators" ? DollarSign : Zap;
  const TabIcon = tabIcon;

  return (
    <section id="features" className="py-24 sm:py-32 px-4 relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/3 rounded-full blur-[200px]" />
      </div>

      <div className="container relative max-w-3xl">
        <div ref={headerRef} className="scroll-reveal text-center mb-12">
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

        {/* Tab toggle */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <button
            onClick={() => setActiveTab("creators")}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
              activeTab === "creators"
                ? "bg-gradient-to-r from-primary to-[hsl(280_90%_65%)] text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
                : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary/80"
            }`}
          >
            For Creators
          </button>
          <button
            onClick={() => setActiveTab("brands")}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
              activeTab === "brands"
                ? "bg-gradient-to-r from-primary to-[hsl(280_90%_65%)] text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
                : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary/80"
            }`}
          >
            For Brands
          </button>
        </div>

        <div ref={contentRef} className="scroll-reveal rounded-2xl border border-border/30 overflow-hidden bg-card/20 backdrop-blur-sm p-8 sm:p-10">
          <div className="space-y-5">
            {benefits.map((b) => (
              <div
                key={`${activeTab}-${b.title}`}
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
    </section>
  );
};

export default WhoItsForSection;
