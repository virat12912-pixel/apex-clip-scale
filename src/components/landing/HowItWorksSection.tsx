import { Upload, Scissors, CheckCircle, BarChart3 } from "lucide-react";
import { ElevatedCard } from "@/components/ui/elevated-card";
import { SectionDivider } from "@/components/ui/section-divider";

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Submit Your Content",
    description: "Upload your content and define campaign goals. Set budget caps, target platforms, and approval criteria.",
  },
  {
    icon: Scissors,
    step: "02",
    title: "Clippers Create Content",
    description: "Our vetted network transforms your content into engaging short-form videos optimized for each platform.",
  },
  {
    icon: CheckCircle,
    step: "03",
    title: "Review & Approve",
    description: "Full control over every clip. Approve, reject, or request revisions before any content goes live.",
  },
  {
    icon: BarChart3,
    step: "04",
    title: "Track & Optimize",
    description: "Real-time analytics dashboard. Monitor views, engagement, and ROI across all platforms.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-20 px-4 relative bg-gradient-dark">
      <div className="container">
        <div className="text-center mb-16">
          <span className="inline-block text-primary text-sm font-semibold tracking-wider uppercase mb-4">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Simple. Transparent. <span className="text-gradient-animated">Professional.</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            From campaign launch to performance tracking—we've streamlined every step for enterprise needs.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 stagger-enter">
          {steps.map((item, index) => (
            <div
              key={item.step}
              className="group relative"
            >
              {/* Connector line (hidden on mobile, visible on lg+) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-[60%] w-full h-px bg-gradient-to-r from-primary/30 to-transparent" />
              )}

              <ElevatedCard variant="elevated" className="relative p-8 h-full">
                {/* Step number */}
                <span className="absolute top-6 right-6 text-5xl font-bold text-muted/30 group-hover:text-primary/20 transition-colors">
                  {item.step}
                </span>

                {/* Icon */}
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-primary text-primary-foreground mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-primary/20">
                  <item.icon className="w-7 h-7" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">{item.title}</h3>

                {/* Description */}
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.description}
                </p>
              </ElevatedCard>
            </div>
          ))}
        </div>

        {/* Enterprise note */}
        <div className="mt-12 text-center">
          <SectionDivider variant="gradient" size="sm" />
          <p className="text-sm text-muted-foreground mt-6">
            <span className="text-primary">Note:</span> No guaranteed views or sales. Results are organic and performance-based.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
