import { useState, useEffect, useRef } from "react";
import { Star, ChevronLeft, ChevronRight, Quote, DollarSign, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const testimonials = [
  {
    type: "clipper",
    name: "Marcus Chen",
    role: "Elite Clipper",
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
    role: "Verified Clipper",
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
  {
    type: "clipper",
    name: "Jordan Lee",
    role: "Elite Clipper",
    content: "Turned my hobby into a full-time income. The flexibility to work on campaigns I love is amazing.",
    rating: 5,
    earnings: "$3,100",
    avatar: "J",
  },
];

const TestimonialsSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index: number) => {
    setActiveIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToPrev = () => {
    goToSlide(activeIndex === 0 ? testimonials.length - 1 : activeIndex - 1);
  };

  const goToNext = () => {
    goToSlide((activeIndex + 1) % testimonials.length);
  };

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container relative">
        <div className="text-center mb-12">
          <span className="inline-block text-primary text-sm font-semibold tracking-wider uppercase mb-4">
            Testimonials
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Trusted by <span className="text-gradient">Brands & Clippers</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Join thousands of satisfied users who are already growing with Amplify.
          </p>
        </div>

        {/* Carousel */}
        <div className="relative max-w-4xl mx-auto">
          {/* Navigation Buttons */}
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 rounded-full bg-card/80 backdrop-blur-sm border-border hover:bg-card hover:border-primary/30 transition-all hidden md:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={goToNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 rounded-full bg-card/80 backdrop-blur-sm border-border hover:bg-card hover:border-primary/30 transition-all hidden md:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          {/* Cards Container */}
          <div 
            ref={containerRef}
            className="overflow-hidden rounded-2xl"
          >
            <div 
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {testimonials.map((testimonial, index) => (
                <div 
                  key={index}
                  className="w-full flex-shrink-0 p-6"
                >
                  <div className="bg-card border border-border rounded-2xl p-8 relative overflow-hidden group card-hover">
                    {/* Quote icon */}
                    <Quote className="absolute top-6 right-6 h-12 w-12 text-primary/10 group-hover:text-primary/20 transition-colors" />
                    
                    {/* Type badge and earnings */}
                    <div className="flex items-center justify-between mb-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                        testimonial.type === "clipper"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-primary/10 text-primary border border-primary/20"
                      }`}>
                        {testimonial.type === "clipper" ? (
                          <>
                            <DollarSign className="w-3 h-3" />
                            Clipper
                          </>
                        ) : (
                          <>
                            <Building2 className="w-3 h-3" />
                            Brand
                          </>
                        )}
                      </span>
                      
                      {testimonial.earnings && (
                        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                          <DollarSign className="w-3 h-3 text-emerald-400" />
                          <span className="text-xs font-semibold text-emerald-400">
                            {testimonial.earnings} earned
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Rating */}
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: testimonial.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>

                    {/* Content */}
                    <p className="text-lg text-foreground mb-6 leading-relaxed">
                      "{testimonial.content}"
                    </p>

                    {/* Author */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-lg font-bold text-primary-foreground">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>

                    {/* Decorative gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === activeIndex 
                    ? "w-8 bg-primary" 
                    : "w-2 bg-muted hover:bg-muted-foreground"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
