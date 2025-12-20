import { Upload, Scissors, BarChart3 } from "lucide-react";

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Launch Your Campaign",
    description: "Creators upload content and set campaign goals. Define your target audience and budget.",
  },
  {
    icon: Scissors,
    step: "02",
    title: "Clippers Create Magic",
    description: "Skilled clippers transform your content into engaging short-form videos across platforms.",
  },
  {
    icon: BarChart3,
    step: "03",
    title: "Track & Get Paid",
    description: "Performance is tracked in real-time. Automated payouts reward top-performing clips.",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-20 px-4 relative bg-gradient-dark">
      <div className="container">
        <div className="text-center mb-16">
          <span className="inline-block text-primary text-sm font-semibold tracking-wider uppercase mb-4">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Simple. Transparent. <span className="text-gradient">Effective.</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            From campaign launch to payout, we've streamlined every step.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
          {steps.map((item, index) => (
            <div
              key={item.step}
              className="group relative"
            >
              {/* Connector line (hidden on mobile, visible on md+) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-[60%] w-full h-px bg-gradient-to-r from-border to-transparent" />
              )}

              <div className="relative p-8 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 h-full">
                {/* Step number */}
                <span className="absolute top-6 right-6 text-5xl font-bold text-muted/30">
                  {item.step}
                </span>

                {/* Icon */}
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-primary text-primary-foreground mb-6 group-hover:scale-110 transition-transform">
                  <item.icon className="w-7 h-7" />
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>

                {/* Description */}
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
