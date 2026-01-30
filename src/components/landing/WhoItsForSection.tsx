import { Check, Building2, DollarSign } from "lucide-react";
import { ElevatedCard } from "@/components/ui/elevated-card";

const clientBenefits = [
  "Scale content without hiring a team",
  "Pay only for performance",
  "Full approval control over all content",
  "Real-time analytics & reporting",
  "Multi-user team access",
  "Budget caps & governance controls",
];

const clipperBenefits = [
  "Earn from your clipping skills",
  "Work on your own schedule",
  "Access premium brand content",
  "Performance-based bonuses",
  "Build your professional portfolio",
  "Tiered rewards (Standard → Elite)",
];

const WhoItsForSection = () => {
  return (
    <section id="for-clients" className="py-20 px-4">
      <div className="container">
        <div className="text-center mb-16">
          <span className="inline-block text-primary text-sm font-semibold tracking-wider uppercase mb-4">
            Who It's For
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Built for <span className="text-gradient-animated">Both Sides</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Whether you're scaling content or earning from your skills, Amplify has you covered.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto stagger-enter">
          {/* Clients Card */}
          <ElevatedCard variant="spotlight" className="group relative p-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)]">
                <Building2 className="w-6 h-6 icon-interactive" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">For Brands & Enterprises</h3>
                <p className="text-sm text-muted-foreground">Scale your content operation</p>
              </div>
            </div>

            {/* Benefits List */}
            <ul className="space-y-4">
              {clientBenefits.map((benefit, index) => (
                <li 
                  key={benefit} 
                  className="flex items-start gap-3 opacity-0 animate-fade-up"
                  style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
                >
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5 group-hover:bg-primary/30 transition-colors">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-muted-foreground text-sm">{benefit}</span>
                </li>
              ))}
            </ul>

            {/* Role badges */}
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground mb-3">Available roles:</p>
              <div className="flex flex-wrap gap-2">
                <span className="badge-enterprise">Client Admin</span>
                <span className="badge-enterprise">Client Manager</span>
                <span className="badge-enterprise">Client Viewer</span>
              </div>
            </div>

            {/* Decorative gradient */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </ElevatedCard>

          {/* Clippers Card */}
          <ElevatedCard id="for-clippers" variant="spotlight" className="group relative p-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)]">
                <DollarSign className="w-6 h-6 icon-interactive" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">For Clippers</h3>
                <p className="text-sm text-muted-foreground">Turn skills into income</p>
              </div>
            </div>

            {/* Benefits List */}
            <ul className="space-y-4">
              {clipperBenefits.map((benefit, index) => (
                <li 
                  key={benefit} 
                  className="flex items-start gap-3 opacity-0 animate-fade-up"
                  style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
                >
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center mt-0.5 group-hover:bg-primary/30 transition-colors">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-muted-foreground text-sm">{benefit}</span>
                </li>
              ))}
            </ul>

            {/* Tier badges */}
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground mb-3">Quality tiers:</p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border">Standard</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">Verified</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">Elite</span>
              </div>
            </div>

            {/* Decorative gradient */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </ElevatedCard>
        </div>
      </div>
    </section>
  );
};

export default WhoItsForSection;
