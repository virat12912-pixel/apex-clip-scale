import { Star, DollarSign, Building2 } from "lucide-react";
import { ElevatedCard } from "@/components/ui/elevated-card";

const testimonials = [
  {
    type: "clipper",
    name: "Marcus Chen",
    role: "Elite Creator",
    content: "I've made over $2,000 in my first month. The platform is intuitive and payments are always on time.",
    rating: 5,
    earnings: "$2,340",
    avatar: "M",
  },
  {
    type: "brand",
    name: "Sarah Johnson",
    role: "VP of Marketing, TechCorp",
    content: "Amplify transformed how we approach content. We went from 10K to 500K monthly views in 3 months.",
    rating: 5,
    avatar: "S",
  },
  {
    type: "clipper",
    name: "Alex Rivera",
    role: "Verified Creator",
    content: "Finally, a platform that values quality. The campaign variety keeps things interesting and profitable.",
    rating: 5,
    earnings: "$1,850",
    avatar: "A",
  },
  {
    type: "brand",
    name: "David Park",
    role: "CEO, GrowthStartup",
    content: "The ROI on our campaigns is incredible. We're getting 10x the engagement at half the cost.",
    rating: 5,
    avatar: "D",
  },
];

const TestimonialsSection = () => {
  return (
    <section id="testimonials" className="py-24 px-4 relative overflow-hidden bg-gradient-dark">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container relative">
        <div className="text-center mb-12">
          <span className="inline-block text-primary text-sm font-semibold tracking-wider uppercase mb-4">
            Success Stories
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Trusted by <span className="text-gradient-animated">Brands & Creators</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Real results from real users on the platform.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto stagger-enter">
          {testimonials.map((t, i) => (
            <ElevatedCard key={i} variant="glass" className="p-6 group relative overflow-hidden">
              {/* Type badge */}
              <div className="flex items-center justify-between mb-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                  t.type === "clipper"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-primary/10 text-primary border border-primary/20"
                }`}>
                  {t.type === "clipper" ? <><DollarSign className="w-3 h-3" /> Creator</> : <><Building2 className="w-3 h-3" /> Brand</>}
                </span>
                {t.earnings && (
                  <span className="text-xs font-semibold text-emerald-400 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    {t.earnings} earned
                  </span>
                )}
              </div>

              {/* Stars */}
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <p className="text-foreground mb-4 leading-relaxed text-sm">"{t.content}"</p>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>

              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </ElevatedCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
