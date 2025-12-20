import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-20">
      {/* Background glow effect */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px] animate-pulse-glow" />
      </div>
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      <div className="container relative z-10 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/50 backdrop-blur-sm mb-8 opacity-0 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm text-muted-foreground">Performance-driven clipping network</span>
        </div>

        {/* Main headline */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 opacity-0 animate-fade-up" style={{ animationDelay: '0.2s' }}>
          Clip Faster.{" "}
          <span className="text-gradient">Scale Harder.</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 opacity-0 animate-fade-up" style={{ animationDelay: '0.3s' }}>
          Apex Clipping connects creators with a global network of skilled clippers. 
          Launch campaigns, track performance, and scale your short-form content organically.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <Button size="lg" className="w-full sm:w-auto bg-gradient-primary hover:opacity-90 transition-opacity text-lg px-8 py-6 glow-primary">
            Get Paid to Clip
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6 border-border hover:bg-secondary">
            <Play className="mr-2 h-5 w-5" />
            Launch a Campaign
          </Button>
        </div>

        {/* Trust indicator */}
        <p className="mt-12 text-sm text-muted-foreground opacity-0 animate-fade-up" style={{ animationDelay: '0.5s' }}>
          Trusted by creators and brands worldwide
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
