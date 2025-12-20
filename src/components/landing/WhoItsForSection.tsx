import { Check, Sparkles, DollarSign, Zap, Wand2, Bot } from "lucide-react";

const creatorBenefits = [
  "Scale content without hiring a team",
  "Pay only for performance",
  "Access a global network of clippers",
  "Real-time analytics dashboard",
  "Full creative control",
];

const clipperBenefits = [
  "Earn money doing what you love",
  "Work on your own schedule",
  "Access premium content to clip",
  "Performance-based bonuses",
  "Build your portfolio",
];

const upcomingTools = [
  {
    icon: Wand2,
    name: "Instant Watermark",
    description: "Auto-brand your clips with one click",
    status: "Coming Soon",
  },
  {
    icon: Bot,
    name: "AI Account Generator",
    description: "Create optimized profiles instantly",
    status: "Coming Soon",
  },
  {
    icon: Zap,
    name: "Smart Analytics",
    description: "AI-powered performance insights",
    status: "Beta",
  },
];

const WhoItsForSection = () => {
  return (
    <section className="py-20 px-4">
      <div className="container">
        <div className="text-center mb-16">
          <span className="inline-block text-primary text-sm font-semibold tracking-wider uppercase mb-4">
            Who It's For
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Built for <span className="text-gradient">Both Sides</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Whether you're scaling content or earning from your skills, Apex has you covered.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto mb-16">
          {/* Creators Card */}
          <div className="group relative p-8 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">For Creators & Brands</h3>
                <p className="text-sm text-muted-foreground">Scale your content empire</p>
              </div>
            </div>

            {/* Benefits List */}
            <ul className="space-y-4">
              {creatorBenefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-muted-foreground text-sm">{benefit}</span>
                </li>
              ))}
            </ul>

            {/* Decorative gradient */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </div>

          {/* Clippers Card */}
          <div className="group relative p-8 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">For Clippers</h3>
                <p className="text-sm text-muted-foreground">Turn skills into income</p>
              </div>
            </div>

            {/* Benefits List */}
            <ul className="space-y-4">
              {clipperBenefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-muted-foreground text-sm">{benefit}</span>
                </li>
              ))}
            </ul>

            {/* Decorative gradient */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </div>
        </div>

        {/* Upcoming Tools Section */}
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <span className="inline-block text-primary text-sm font-semibold tracking-wider uppercase mb-2">
              Power Tools
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold">
              Tools to <span className="text-gradient">Supercharge</span> Your Workflow
            </h3>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {upcomingTools.map((tool) => (
              <div
                key={tool.name}
                className="group relative p-6 rounded-xl bg-card/50 border border-border hover:border-primary/30 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                    <tool.icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    tool.status === "Beta" 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                      : "bg-primary/10 text-primary border border-primary/20"
                  }`}>
                    {tool.status}
                  </span>
                </div>
                <h4 className="font-semibold mb-1">{tool.name}</h4>
                <p className="text-sm text-muted-foreground">{tool.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhoItsForSection;