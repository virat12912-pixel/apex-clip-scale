import { useState } from "react";
import { Check } from "lucide-react";

const brandSteps = [
  {
    title: "Step 1",
    heading: "Create a Campaign",
    description: "Launch your campaign in minutes. Set your budget, describe the goals, and choose the platforms you want to target.",
    features: ["Set campaign budget and goals", "Choose target platforms", "Define campaign requirements", "Launch in minutes"],
  },
  {
    title: "Step 2",
    heading: "Get Matched with Creators",
    description: "We'll connect you with creators who align with your brand and audience through our performance-based system.",
    features: ["Performance-based creator matching", "Audience alignment analysis", "Creator portfolio review"],
  },
  {
    title: "Step 3",
    heading: "Track Performance in Real Time",
    description: "Monitor clicks, conversions, and content performance — all in one dashboard.",
    features: ["Real-time analytics dashboard", "Click and conversion tracking", "Content performance metrics", "ROI monitoring"],
  },
];

const creatorSteps = [
  {
    title: "Step 1",
    heading: "Join & Build Your Profile",
    description: "Sign up with your email, choose \"Creator,\" and link your social media accounts. It's free and only takes a minute.",
    features: ["Free account creation", "Social media integration", "Profile customization", "Quick setup process"],
  },
  {
    title: "Step 2",
    heading: "Browse Paid Campaigns",
    description: "Get instant access to active campaigns from brands looking for creators like you.",
    features: ["Browse active campaigns", "Filter by niche and budget", "Instant campaign access", "Brand matching"],
  },
  {
    title: "Step 3",
    heading: "Post & Earn",
    description: "Create content, share links, or post brand-approved assets. Get paid for every 1000 views.",
    features: ["Flexible content creation", "Multiple earning methods", "Brand-approved assets", "Performance-based payments"],
  },
];

const HowItWorksSection = () => {
  const [activeTab, setActiveTab] = useState<"brands" | "creators">("brands");
  const steps = activeTab === "brands" ? brandSteps : creatorSteps;

  return (
    <section id="how-it-works" className="py-28 px-4 relative">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      <div className="container relative">
        <div className="text-center mb-14">
          <span className="inline-block text-primary text-xs font-semibold tracking-[0.2em] uppercase mb-4">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-5">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base mb-10">
            Whether you're a brand looking to scale or a creator ready to monetize, our platform makes it easy to get started and see results.
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

        <div className="grid md:grid-cols-3 gap-5 max-w-5xl mx-auto" key={activeTab}>
          {steps.map((item, index) => (
            <div
              key={item.heading}
              className="group relative rounded-2xl border border-border bg-card/50 p-7 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 opacity-0 animate-fade-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Step label */}
              <span className="text-xs font-semibold tracking-[0.15em] uppercase text-primary mb-4 block">
                {item.title}
              </span>

              {/* Heading */}
              <h3 className="text-lg font-bold mb-3 group-hover:text-primary transition-colors">{item.heading}</h3>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">{item.description}</p>

              {/* Features */}
              <div className="space-y-2.5">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Features:</span>
                {item.features.map((f) => (
                  <div key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-primary" />
                    </div>
                    {f}
                  </div>
                ))}
              </div>

              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          ))}
        </div>

        {/* Bottom CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-14">
          <a href="/auth" className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/25">
            Join as a Brand →
          </a>
          <a href="/auth" className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/25">
            Join as a Creator →
          </a>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
