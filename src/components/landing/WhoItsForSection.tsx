import { Check, Sparkles, DollarSign } from "lucide-react";

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

        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
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
      </div>
    </section>
  );
};

export default WhoItsForSection;
