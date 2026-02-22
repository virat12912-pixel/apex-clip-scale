import { useState } from "react";
import { Check } from "lucide-react";

const brandBenefits = [
  {
    title: "Performance-Based",
    subtitle: "Zero Risk Investment",
    description: "No upfront risk. Pay only for performance. We manage everything, you watch results.",
    features: ["No upfront costs or hidden fees", "Full campaign management included", "Real-time analytics and reporting"],
  },
  {
    title: "Cost-Effective",
    subtitle: "Higher ROI",
    description: "Cheaper and more efficient than paid ads with better ROI and authentic engagement.",
    features: ["Better ROI than traditional ads", "High-quality content creation", "Multi-platform reach and exposure"],
  },
];

const creatorBenefits = [
  {
    title: "Training & Support",
    subtitle: "Expert Guidance",
    description: "Free expert training and support to help you succeed. Build recurring income with instant payouts.",
    features: ["Free training by industry experts", "Access to viral brand partnerships", "Build sustainable recurring income"],
  },
  {
    title: "Earnings & Analytics",
    subtitle: "Maximize Revenue",
    description: "High-paying deals with bonus rewards, instant payouts, and comprehensive analytics tracking.",
    features: ["High-paying deals with bonus rewards", "Instant payouts and withdrawals", "Real-time analytics and performance tracking"],
  },
];

const WhoItsForSection = () => {
  const [activeTab, setActiveTab] = useState<"brands" | "creators">("brands");
  const benefits = activeTab === "brands" ? brandBenefits : creatorBenefits;

  return (
    <section id="features" className="py-24 sm:py-32 px-4 relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/3 rounded-full blur-[200px]" />
      </div>

      <div className="container relative max-w-4xl">
        <div className="text-center mb-14">
          <span className="text-primary text-xs font-semibold tracking-[0.2em] uppercase mb-4 block">
            Why Choose Us
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Why Choose Amplify
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base mb-10">
            Discover what makes Amplify the preferred platform for brands and creators worldwide.
          </p>

          <div className="inline-flex items-center rounded-full border border-border/50 bg-card/50 p-1 gap-0.5">
            {(["brands", "creators"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeTab === tab
                    ? "bg-primary text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.3)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                For {tab === "brands" ? "Brands" : "Creators"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5" key={activeTab}>
          {benefits.map((item, index) => (
            <div
              key={item.title}
              className="group relative rounded-2xl border border-border/40 bg-card/30 p-7 sm:p-8 hover:border-primary/25 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <h3 className="text-lg sm:text-xl font-bold mb-1 group-hover:text-primary transition-colors">{item.title}</h3>
              <p className="text-xs text-primary/50 font-medium mb-3 uppercase tracking-wider">{item.subtitle}</p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">{item.description}</p>

              <div className="space-y-2.5">
                {item.features.map((f) => (
                  <div key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground/80">
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
      </div>
    </section>
  );
};

export default WhoItsForSection;
