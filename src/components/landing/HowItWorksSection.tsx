import { useState } from "react";
import { Upload, Scissors, BarChart3, FileText, Users, DollarSign } from "lucide-react";
import { ElevatedCard } from "@/components/ui/elevated-card";

const brandSteps = [
  {
    icon: Upload,
    step: "01",
    title: "Launch a Campaign",
    description: "Set your budget, define campaign goals, choose platforms, and upload your source content.",
    features: ["Budget caps & governance", "Multi-platform targeting", "Custom approval criteria"],
  },
  {
    icon: Users,
    step: "02",
    title: "Creators Make Content",
    description: "Our vetted network of creators transforms your content into engaging short-form videos.",
    features: ["Vetted creator network", "Quality-controlled output", "Platform-optimized clips"],
  },
  {
    icon: BarChart3,
    step: "03",
    title: "Track & Scale",
    description: "Monitor performance in real-time. Approve content, track views, and optimize your ROI.",
    features: ["Real-time analytics", "Full approval control", "Performance reporting"],
  },
];

const creatorSteps = [
  {
    icon: FileText,
    step: "01",
    title: "Browse Campaigns",
    description: "Find campaigns that match your niche and content style. Apply to the ones you love.",
    features: ["Filter by niche & platform", "See earning potential", "Choose your schedule"],
  },
  {
    icon: Scissors,
    step: "02",
    title: "Create & Submit",
    description: "Clip engaging short-form content and submit for review. Get feedback and iterate.",
    features: ["Creative freedom", "Submission tracking", "Revision support"],
  },
  {
    icon: DollarSign,
    step: "03",
    title: "Get Paid",
    description: "Earn based on views and performance. Track earnings and request payouts anytime.",
    features: ["Performance-based pay", "Transparent earnings", "Fast payouts"],
  },
];

const HowItWorksSection = () => {
  const [activeTab, setActiveTab] = useState<"brands" | "creators">("brands");
  const steps = activeTab === "brands" ? brandSteps : creatorSteps;

  return (
    <section id="how-it-works" className="py-24 px-4 relative bg-gradient-dark">
      <div className="container">
        <div className="text-center mb-12">
          <span className="inline-block text-primary text-sm font-semibold tracking-wider uppercase mb-4">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Simple. Transparent. <span className="text-gradient-animated">Effective.</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Whether you're a brand or creator, getting started takes minutes.
          </p>

          {/* Tab Toggle */}
          <div className="inline-flex items-center rounded-full border border-border bg-secondary/50 p-1">
            <button
              onClick={() => setActiveTab("brands")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeTab === "brands"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              For Brands
            </button>
            <button
              onClick={() => setActiveTab("creators")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeTab === "creators"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              For Creators
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto stagger-enter" key={activeTab}>
          {steps.map((item) => (
            <div key={item.step} className="group relative">
              <ElevatedCard variant="elevated" className="relative p-8 h-full">
                <span className="absolute top-6 right-6 text-5xl font-bold text-muted/20 group-hover:text-primary/20 transition-colors">
                  {item.step}
                </span>

                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-primary text-primary-foreground mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-primary/20">
                  <item.icon className="w-7 h-7" />
                </div>

                <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">{item.description}</p>

                <ul className="space-y-2">
                  {item.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                      {f}
                    </li>
                  ))}
                </ul>
              </ElevatedCard>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            <span className="text-primary">Note:</span> No guaranteed views or sales. Results are organic and performance-based.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
