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
    <section id="features" className="py-28 px-4 relative">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      <div className="container relative">
        <div className="text-center mb-14">
          <span className="inline-block text-primary text-xs font-semibold tracking-[0.2em] uppercase mb-4">
            Why Choose Us
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-5">
            Why Choose Amplify
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base mb-10">
            Discover what makes Amplify the preferred platform for brands and creators worldwide.
          </p>

          {/* Tab Toggle */}
          <div className="inline-flex items-center rounded-full border border-border bg-card p-1 gap-1">
            <button
              onClick={() => setActiveTab("brands")}
              className={`px-7 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                activeTab === "brands"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              For Brands
            </button>
            <button
              onClick={() => setActiveTab("creators")}
              className={`px-7 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                activeTab === "creators"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              For Creators
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto" key={activeTab}>
          {benefits.map((item, index) => (
            <div
              key={item.title}
              className="group rounded-2xl border border-border bg-card/50 p-8 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 opacity-0 animate-fade-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">{item.title}</h3>
              <p className="text-sm text-primary/70 font-medium mb-3">{item.subtitle}</p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">{item.description}</p>

              <div className="space-y-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {activeTab === "brands" ? "Benefits:" : "Features:"}
                </span>
                {item.features.map((f) => (
                  <div key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-primary" />
                    </div>
                    {f}
                  </div>
                ))}
              </div>

              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhoItsForSection;
