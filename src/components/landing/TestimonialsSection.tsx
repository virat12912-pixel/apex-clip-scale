const testimonials = [
  {
    heading: "Creator Success",
    description: "Quit his job after 3 campaigns from Amplify's clipping opportunities.",
    earnings: "$1,523",
    gradient: "from-primary/20 to-primary/5",
  },
  {
    heading: "Creator Success", 
    description: "Already made $1,000 in his first week at just 15 years old.",
    earnings: "$1,000",
    gradient: "from-emerald-500/20 to-emerald-500/5",
  },
];

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-28 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      <div className="container relative">
        <div className="text-center mb-5">
          <span className="inline-block text-primary text-xs font-semibold tracking-[0.2em] uppercase mb-4">
            Success Stories
          </span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-5 text-center">
          Real Results from{" "}
          <span className="text-gradient-animated">Real Users</span>
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto text-base mb-14 text-center">
          See how creators and brands are achieving success with Amplify
        </p>

        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="group rounded-2xl border border-border bg-card/50 overflow-hidden hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 opacity-0 animate-fade-up"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              {/* Content */}
              <div className="p-6">
                <h3 className="text-lg font-bold mb-2">{t.heading}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{t.description}</p>
              </div>

              {/* Earnings visual */}
              <div className={`bg-gradient-to-br ${t.gradient} p-8 text-center border-t border-border/30`}>
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Earnings</p>
                <p className="text-4xl font-bold text-foreground">{t.earnings}</p>
                <p className="text-xs text-muted-foreground mt-2">Verified payout</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
