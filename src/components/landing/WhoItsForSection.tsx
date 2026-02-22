import { useState } from "react";
import { TrendingUp, Shield, Headphones, DollarSign, BarChart3, Users, Zap, Target } from "lucide-react";
import { ElevatedCard } from "@/components/ui/elevated-card";

const brandBenefits = [
  {
    icon: TrendingUp,
    title: "Performance-Based",
    description: "Pay only for results. Budget-based pricing means you control costs while maximizing organic reach.",
  },
  {
    icon: Shield,
    title: "Full Approval Control",
    description: "Review and approve every piece of content before it goes live. Your brand, your standards.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description: "Track views, engagement, and ROI across all platforms from a single enterprise dashboard.",
  },
  {
    icon: Target,
    title: "Targeted Distribution",
    description: "Reach your ideal audience through niche-specific creators who know their communities.",
  },
];

const creatorBenefits = [
  {
    icon: DollarSign,
    title: "Earn From Your Skills",
    description: "Turn your content creation skills into consistent income. Performance bonuses for top creators.",
  },
  {
    icon: Users,
    title: "Premium Campaigns",
    description: "Access campaigns from top brands. Work on content you're passionate about.",
  },
  {
    icon: Headphones,
    title: "Training & Support",
    description: "Level up with resources, feedback, and a community of fellow creators.",
  },
  {
    icon: Zap,
    title: "Fast Payouts",
    description: "Transparent earnings tracking and quick payouts. See exactly what you earn and when.",
  },
];

const WhoItsForSection = () => {
  const [activeTab, setActiveTab] = useState<"brands" | "creators">("brands");
  const benefits = activeTab === "brands" ? brandBenefits : creatorBenefits;

  return (
    <section id="features" className="py-24 px-4">
      <div className="container">
        <div className="text-center mb-12">
          <span className="inline-block text-primary text-sm font-semibold tracking-wider uppercase mb-4">
            Why Amplify
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Built for <span className="text-gradient-animated">Both Sides</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Whether you're scaling content or earning from your skills, Amplify has you covered.
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

        <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto stagger-enter" key={activeTab}>
          {benefits.map((item) => (
            <ElevatedCard key={item.title} variant="spotlight" className="group relative p-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform duration-300">
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </ElevatedCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhoItsForSection;
