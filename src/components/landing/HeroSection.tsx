import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const rotatingWords = ["TikTok", "Instagram", "YouTube"];

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const platformIcons = [
  { icon: TikTokIcon, name: "TikTok" },
  { icon: InstagramIcon, name: "Instagram" },
  { icon: YouTubeIcon, name: "YouTube" },
  { icon: TwitterIcon, name: "X / Twitter" },
  { icon: TikTokIcon, name: "TikTok" },
  { icon: InstagramIcon, name: "Instagram" },
  { icon: YouTubeIcon, name: "YouTube" },
  { icon: TwitterIcon, name: "X / Twitter" },
];

const HeroSection = () => {
  const navigate = useNavigate();
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % rotatingWords.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden px-4 pt-20 pb-10">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center gpu-accelerated">
        <div className="w-[600px] h-[600px] rounded-full bg-primary/10 blur-[150px] pulse-glow gpu-accelerated" />
      </div>

      <div className="container relative z-10 text-center max-w-4xl">
        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 opacity-0 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          We distribute short-form content across{" "}
          <span className="text-gradient-animated inline-block min-w-[140px] sm:min-w-[200px]">
            <span key={wordIndex} className="inline-block animate-fade-up">
              {rotatingWords[wordIndex]}
            </span>
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 opacity-0 animate-fade-up" style={{ animationDelay: '0.2s' }}>
          Amplify connects brands with thousands of creators to scale short-form content organically. Launch campaigns, track performance, and grow.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <Button size="lg" variant="glow" className="w-full sm:w-auto text-lg px-8 py-6" onClick={() => navigate("/auth")}>
            Join as Creator
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button size="lg" variant="glow" className="w-full sm:w-auto text-lg px-8 py-6" onClick={() => navigate("/auth")}>
            Join as Brand
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-16 opacity-0 animate-fade-up relative" style={{ animationDelay: '0.4s' }}>
          <div className="rounded-2xl border border-border/50 overflow-hidden glass-card p-1">
            <div className="rounded-xl bg-card p-6 sm:p-8">
              {/* Mock dashboard header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
                <div className="text-xs text-muted-foreground font-mono">amplify.app/dashboard</div>
                <div />
              </div>
              {/* Mock stats row */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="rounded-lg bg-secondary p-4 text-left">
                  <p className="text-xs text-muted-foreground mb-1">Total Views</p>
                  <p className="text-2xl font-bold text-foreground">47.2M</p>
                  <p className="text-xs text-emerald-400">+12.5%</p>
                </div>
                <div className="rounded-lg bg-secondary p-4 text-left">
                  <p className="text-xs text-muted-foreground mb-1">Active Creators</p>
                  <p className="text-2xl font-bold text-foreground">2,400+</p>
                  <p className="text-xs text-emerald-400">+8.3%</p>
                </div>
                <div className="rounded-lg bg-secondary p-4 text-left">
                  <p className="text-xs text-muted-foreground mb-1">Campaigns</p>
                  <p className="text-2xl font-bold text-foreground">890</p>
                  <p className="text-xs text-emerald-400">+15.2%</p>
                </div>
              </div>
              {/* Mock chart bars */}
              <div className="flex items-end gap-2 h-24">
                {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                  <div key={i} className="flex-1 bg-primary/30 rounded-t-sm hover:bg-primary/50 transition-colors" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>
          {/* Glow behind dashboard */}
          <div className="absolute -inset-4 bg-primary/5 blur-3xl rounded-3xl -z-10" />
        </div>
      </div>

      {/* Platform Marquee */}
      <div className="w-full mt-16 opacity-0 animate-fade-up" style={{ animationDelay: '0.5s' }}>
        <p className="text-center text-sm text-muted-foreground mb-6">Distribute across all major platforms</p>
        <div className="marquee-container overflow-hidden">
          <div className="marquee-track flex gap-12 items-center">
            {[...platformIcons, ...platformIcons].map((platform, i) => (
              <div key={i} className="flex items-center gap-2 text-muted-foreground/50 flex-shrink-0">
                <platform.icon />
                <span className="text-sm font-medium whitespace-nowrap">{platform.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
