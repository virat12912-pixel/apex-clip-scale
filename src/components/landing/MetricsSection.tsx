import { Users, Eye, CheckCircle, Film, Building2, Globe } from "lucide-react";

const metrics = [
  {
    icon: Users,
    value: "2,400+",
    label: "Vetted Clippers",
    description: "Quality-screened professionals",
  },
  {
    icon: Eye,
    value: "47M+",
    label: "Views Generated",
    description: "Organic reach delivered",
  },
  {
    icon: CheckCircle,
    value: "890+",
    label: "Campaigns Completed",
    description: "Enterprise-grade launches",
  },
  {
    icon: Building2,
    value: "150+",
    label: "Brands Trust Us",
    description: "From startups to enterprises",
  },
];

const MetricsSection = () => {
  return (
    <section className="py-20 px-4 relative">
      {/* Subtle top border glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      <div className="container">
        {/* Live community indicator */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-card border border-border">
            <div className="relative flex items-center justify-center">
              <span className="absolute w-3 h-3 rounded-full bg-emerald-500 animate-ping opacity-75" />
              <span className="relative w-3 h-3 rounded-full bg-emerald-500" />
            </div>
            <span className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">+25,767</span> active creators in the network
            </span>
          </div>
        </div>

        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Built for <span className="text-gradient">Enterprise Scale</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Real results from real brands. Our platform delivers measurable impact at any scale.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {metrics.map((metric, index) => (
            <div
              key={metric.label}
              className="group relative p-6 sm:p-8 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 card-shadow"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform">
                <metric.icon className="w-6 h-6" />
              </div>
              
              {/* Value */}
              <div className="text-3xl sm:text-4xl font-bold text-foreground mb-1">
                {metric.value}
              </div>
              
              {/* Label */}
              <div className="text-sm font-medium text-foreground mb-1">
                {metric.label}
              </div>
              
              {/* Description */}
              <div className="text-xs text-muted-foreground">
                {metric.description}
              </div>

              {/* Hover glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MetricsSection;
