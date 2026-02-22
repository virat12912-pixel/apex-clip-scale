const testimonials = [
  {
    heading: "Creator Success",
    description: "Quit his job after 3 campaigns from Amplify's clipping opportunities.",
    earnings: "$1,523",
  },
  {
    heading: "Creator Success",
    description: "Already made $1,000 in his first week at just 15 years old.",
    earnings: "$1,000",
  },
];

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-24 sm:py-32 px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/3 rounded-full blur-[200px]" />
      </div>

      <div className="container relative max-w-3xl">
        <div className="text-center mb-14">
          <span className="text-primary text-xs font-semibold tracking-[0.2em] uppercase mb-4 block">
            Success Stories
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Real Results from Real Users
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base">
            See how creators are achieving success with Amplify
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="group rounded-2xl border border-border/40 bg-card/30 overflow-hidden hover:border-primary/25 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="p-6">
                <h3 className="text-base font-bold mb-2">{t.heading}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t.description}</p>
              </div>
              <div className="bg-primary/[0.06] p-8 text-center border-t border-border/20">
                <p className="text-[10px] text-muted-foreground/60 mb-1.5 uppercase tracking-widest">Earnings</p>
                <p className="text-3xl sm:text-4xl font-bold text-foreground">{t.earnings}</p>
                <p className="text-[10px] text-muted-foreground/50 mt-1.5">Verified payout</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
