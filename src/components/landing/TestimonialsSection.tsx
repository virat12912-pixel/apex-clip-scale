import { Star } from "lucide-react";

const testimonials = [
  {
    type: "Creator",
    name: "Marcus Chen",
    role: "Gaming Content Creator",
    avatar: "MC",
    content: "Apex completely changed how I approach short-form content. I went from 2 clips a week to 20, and my reach tripled in the first month.",
    rating: 5,
  },
  {
    type: "Clipper",
    name: "Sarah Williams",
    role: "Professional Clipper",
    avatar: "SW",
    content: "I've tried other platforms, but Apex pays better and faster. The dashboard makes it easy to find campaigns that match my style.",
    rating: 5,
  },
  {
    type: "Brand",
    name: "David Park",
    role: "Marketing Director, TechFlow",
    avatar: "DP",
    content: "We needed to scale our social presence fast. Apex delivered 150+ clips in our first campaign with measurable ROI. Game changer for brands.",
    rating: 5,
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-20 px-4 relative bg-gradient-dark overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />

      <div className="container relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block text-primary text-sm font-semibold tracking-wider uppercase mb-4">
            Testimonials
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Loved by <span className="text-gradient">Creators & Clippers</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Real stories from real users building with Apex Clipping.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className="group relative p-6 sm:p-8 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300"
            >
              {/* Type badge */}
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mb-4">
                {testimonial.type}
              </span>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>

              {/* Content */}
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-semibold text-primary-foreground">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-medium text-sm">{testimonial.name}</div>
                  <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>

              {/* Decorative gradient */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
