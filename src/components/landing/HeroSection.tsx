import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";

const typewriterPhrases = [
  "content across TikTok",
  "content across Instagram",
  "content across YouTube",
  "clips to millions of viewers",
];

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const platformIcons = [
  { icon: TikTokIcon, name: "TikTok" },
  { icon: InstagramIcon, name: "Instagram" },
  { icon: YouTubeIcon, name: "YouTube" },
  { icon: TwitterIcon, name: "X" },
  { icon: FacebookIcon, name: "Facebook" },
];

const HeroSection = () => {
  const navigate = useNavigate();
  const [displayText, setDisplayText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const typeSpeed = isDeleting ? 30 : 60;

  const tick = useCallback(() => {
    const currentPhrase = typewriterPhrases[phraseIndex];
    
    if (!isDeleting) {
      setDisplayText(currentPhrase.substring(0, displayText.length + 1));
      if (displayText.length + 1 === currentPhrase.length) {
        setTimeout(() => setIsDeleting(true), 2000);
        return;
      }
    } else {
      setDisplayText(currentPhrase.substring(0, displayText.length - 1));
      if (displayText.length === 0) {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % typewriterPhrases.length);
        return;
      }
    }
  }, [displayText, isDeleting, phraseIndex]);

  useEffect(() => {
    const timer = setTimeout(tick, typeSpeed);
    return () => clearTimeout(timer);
  }, [tick, typeSpeed]);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-start overflow-hidden px-4 pt-32 pb-0">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Large central glow */}
        <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/20 rounded-full blur-[200px] gpu-accelerated" />
        {/* Side accents */}
        <div className="absolute top-[10%] left-[10%] w-[300px] h-[300px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[10%] w-[200px] h-[200px] bg-primary/8 rounded-full blur-[100px]" />
        {/* Decorative lines */}
        <div className="absolute top-[25%] left-[20%] w-[200px] h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent rotate-45" />
        <div className="absolute top-[30%] right-[15%] w-[150px] h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent -rotate-45" />
      </div>

      <div className="container relative z-10 text-center max-w-5xl">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-primary/30 bg-primary/5 mb-8 opacity-0 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm text-foreground font-medium">Your Perfect Social Media Marketing Platform</span>
        </div>

        {/* Main headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 opacity-0 animate-fade-up leading-[1.1]" style={{ animationDelay: '0.2s' }}>
          Scale Your Brand Organically{" "}
          <br className="hidden sm:block" />
          Across Thousands of Creators
        </h1>

        {/* Typewriter subtitle */}
        <p className="text-lg sm:text-xl text-muted-foreground mb-10 opacity-0 animate-fade-up h-8" style={{ animationDelay: '0.3s' }}>
          We distribute short-form <span className="text-foreground font-medium">{displayText}</span>
          <span className="typewriter-cursor text-primary">|</span>
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <Button size="lg" variant="glow" className="w-full sm:w-auto text-base px-8 py-6 rounded-full" onClick={() => navigate("/auth")}>
            Join as Creator
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button size="lg" variant="glow" className="w-full sm:w-auto text-base px-8 py-6 rounded-full" onClick={() => navigate("/auth")}>
            Join as Brand
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-20 opacity-0 animate-fade-up relative" style={{ animationDelay: '0.5s' }}>
          {/* Glow behind */}
          <div className="absolute -inset-8 bg-primary/8 blur-[60px] rounded-3xl -z-10" />
          
          <div className="rounded-2xl border border-border/60 overflow-hidden bg-card/80 backdrop-blur-sm shadow-2xl shadow-primary/10">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-card">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[hsl(0,84%,60%)]" />
                <div className="w-3 h-3 rounded-full bg-[hsl(45,93%,58%)]" />
                <div className="w-3 h-3 rounded-full bg-[hsl(142,71%,45%)]" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-secondary rounded-md px-3 py-1 text-xs text-muted-foreground text-center max-w-xs mx-auto">
                  amplify.app/dashboard
                </div>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="p-4 sm:p-6">
              {/* Search bar */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 bg-secondary/60 rounded-lg px-4 py-2.5 text-sm text-muted-foreground flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  Search...
                </div>
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-lg bg-secondary/60" />
                  <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30" />
                </div>
              </div>

              {/* Stats cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <div className="rounded-xl bg-secondary/40 border border-border/30 p-4 text-left">
                  <p className="text-xs text-muted-foreground mb-1">Total Earnings</p>
                  <p className="text-xl sm:text-2xl font-bold text-primary">$12,450</p>
                  <div className="mt-2 w-full bg-secondary rounded-full h-1.5">
                    <div className="bg-primary h-1.5 rounded-full" style={{ width: '65%' }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">65% to goal</p>
                </div>
                <div className="rounded-xl bg-secondary/40 border border-border/30 p-4 text-left">
                  <p className="text-xs text-muted-foreground mb-1">Total Views</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">47.2M</p>
                  <p className="text-xs text-muted-foreground mt-1">Across 142 submissions</p>
                </div>
                <div className="rounded-xl bg-secondary/40 border border-border/30 p-4 text-left">
                  <p className="text-xs text-muted-foreground mb-1">Active Campaigns</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">24</p>
                  <p className="text-xs text-muted-foreground mt-1">8 pending review</p>
                </div>
                <div className="rounded-xl bg-secondary/40 border border-border/30 p-4 text-left">
                  <p className="text-xs text-muted-foreground mb-1">Success Rate</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground">94%</p>
                  <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
                    Good standing
                  </p>
                </div>
              </div>

              {/* Analytics section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="lg:col-span-2 rounded-xl bg-secondary/40 border border-border/30 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-foreground flex items-center gap-2">
                        📊 Analytics
                      </p>
                      <p className="text-xs text-muted-foreground">Your performance this week</p>
                    </div>
                    <div className="flex gap-1">
                      <span className="px-3 py-1 rounded-full text-xs bg-primary text-primary-foreground">Earnings</span>
                      <span className="px-3 py-1 rounded-full text-xs bg-secondary text-muted-foreground">Views</span>
                    </div>
                  </div>
                  <div className="flex items-end gap-1 h-20">
                    {[35, 55, 40, 70, 50, 85, 65, 90, 55, 75, 60, 80, 45, 95].map((h, i) => (
                      <div key={i} className="flex-1 bg-primary/20 rounded-t-sm transition-colors hover:bg-primary/40" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
                <div className="rounded-xl bg-secondary/40 border border-border/30 p-4">
                  <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    ⚡ Quick Actions
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-secondary/60 hover:bg-secondary transition-colors cursor-pointer">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs">📤</div>
                      <div>
                        <p className="text-xs font-medium text-foreground">Submit Content</p>
                        <p className="text-[10px] text-muted-foreground">Upload new post</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-secondary/60 hover:bg-secondary transition-colors cursor-pointer">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs">💰</div>
                      <div>
                        <p className="text-xs font-medium text-foreground">View Earnings</p>
                        <p className="text-[10px] text-muted-foreground">Check balance</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Marquee */}
      <div className="w-full mt-20 pb-12 opacity-0 animate-fade-up" style={{ animationDelay: '0.6s' }}>
        <div className="marquee-container overflow-hidden py-6">
          <div className="marquee-track flex gap-16 items-center">
            {[...platformIcons, ...platformIcons, ...platformIcons, ...platformIcons].map((platform, i) => (
              <div key={i} className="flex items-center gap-3 text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors flex-shrink-0">
                <platform.icon />
                <span className="text-base font-medium whitespace-nowrap">{platform.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
