import { useState } from "react";
import { Check } from "lucide-react";

const brandSteps = [
  {
    num: "01",
    heading: "Create a Campaign",
    description: "Launch your campaign in minutes. Set your budget, describe the goals, and choose the platforms you want to target.",
    features: ["Set campaign budget and goals", "Choose target platforms", "Define campaign requirements", "Launch in minutes"],
  },
  {
    num: "02",
    heading: "Get Matched with Creators",
    description: "We'll connect you with creators who align with your brand and audience through our performance-based system.",
    features: ["Performance-based creator matching", "Audience alignment analysis", "Creator portfolio review"],
  },
  {
    num: "03",
    heading: "Track Performance in Real Time",
    description: "Monitor clicks, conversions, and content performance — all in one dashboard.",
    features: ["Real-time analytics dashboard", "Click and conversion tracking", "Content performance metrics", "ROI monitoring"],
  },
];

const creatorSteps = [
  {
    num: "01",
    heading: "Join & Build Your Profile",
    description: "Sign up with your email, choose \"Creator,\" and link your social media accounts. It's free and only takes a minute.",
    features: ["Free account creation", "Social media integration", "Profile customization", "Quick setup process"],
  },
  {
    num: "02",
    heading: "Browse Paid Campaigns",
    description: "Get instant access to active campaigns from brands looking for creators like you.",
    features: ["Browse active campaigns", "Filter by niche and budget", "Instant campaign access", "Brand matching"],
  },
  {
    num: "03",
    heading: "Post & Earn",
    description: "Create content, share links, or post brand-approved assets. Get paid for every 1000 views.",
    features: ["Flexible content creation", "Multiple earning methods", "Brand-approved assets", "Performance-based payments"],
  },
];

const TabToggle = ({ active, onChange }: { active: string; onChange: (v: "brands" | "creators") => void }) => (
  <div className="inline-flex items-center rounded-full border border-border/50 bg-card/50 p-1 gap-0.5">
    {(["brands", "creators"] as const).map((tab) => (
      <button
        key={tab}
        onClick={() => onChange(tab)}
        className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
          active === tab
            ? "bg-primary text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.3)]"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        For {tab === "brands" ? "Brands" : "Creators"}
      </button>
    ))}
  </div>
);

const HowItWorksSection = () => {
  const [activeTab, setActiveTab] = useState<"brands" | "creators">("brands");
  const steps = activeTab === "brands" ? brandSteps : creatorSteps;

  return (
    <section id="how-it-works" className="py-24 sm:py-32 px-4 relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[200px]" />
      </div>

      <div className="container relative max-w-5xl">
        <div className="text-center mb-14">
          <span className="text-primary text-xs font-semibold tracking-[0.2em] uppercase mb-4 block">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base mb-10">
            Whether you're a brand looking to scale or a creator ready to monetize, get started and see results.
          </p>
          <TabToggle active={activeTab} onChange={setActiveTab} />
        </div>

        <div className="grid md:grid-cols-3 gap-4 sm:gap-5" key={activeTab}>
          {steps.map((item, index) => (
            <div
              key={item.heading}
              className="group relative rounded-2xl border border-border/40 bg-card/30 p-6 sm:p-7 hover:border-primary/25 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              {/* Step number */}
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary/60 mb-4 block">
                Step {item.num}
              </span>

              <h3 className="text-base sm:text-lg font-bold mb-2.5 group-hover:text-primary transition-colors">{item.heading}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">{item.description}</p>

              <div className="space-y-2">
                {item.features.map((f) => (
                  <div key={f} className="flex items-center gap-2.5 text-xs sm:text-sm text-muted-foreground/80">
                    <div className="w-3.5 h-3.5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2 h-2 text-primary" />
                    </div>
                    {f}
                  </div>
                ))}
              </div>

              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-14">
          <a
            href="/auth"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
          >
            Join as a Brand →
          </a>
          <a
            href="/auth"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-all shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
          >
            Join as a Creator →
          </a>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
