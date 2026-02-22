import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import dashboardPreview from "@/assets/dashboard-preview.png";

const typewriterPhrases = [
  "content across TikTok",
  "content across Instagram",
  "content across YouTube",
  "clips to millions of viewers",
];

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

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
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
    <section className="relative min-h-screen flex flex-col items-center justify-start overflow-hidden px-4 pt-28 sm:pt-36 pb-0">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-primary/15 rounded-full blur-[250px]" />
        <div className="absolute top-[5%] left-[5%] w-[400px] h-[400px] bg-primary/8 rounded-full blur-[150px]" />
        <div className="absolute top-[15%] right-[5%] w-[300px] h-[300px] bg-primary/6 rounded-full blur-[120px]" />
      </div>

      {/* Decorative geometric lines - like vyron */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Left angular decoration */}
        <svg className="absolute left-[8%] top-[22%] w-[200px] h-[200px] opacity-20" viewBox="0 0 200 200" fill="none">
          <path d="M100 10 L10 100 L30 120 L100 50 L170 120 L190 100 Z" stroke="hsl(var(--primary))" strokeWidth="1" fill="none" />
          <path d="M100 40 L40 100 L55 115 L100 70 L145 115 L160 100 Z" stroke="hsl(var(--primary))" strokeWidth="0.5" fill="none" opacity="0.5" />
        </svg>
        {/* Right angular decoration */}
        <svg className="absolute right-[5%] top-[18%] w-[250px] h-[250px] opacity-15" viewBox="0 0 250 250" fill="none">
          <path d="M125 20 L20 125 L45 150 L125 70 L205 150 L230 125 Z" stroke="hsl(var(--primary))" strokeWidth="1" fill="none" />
          <path d="M125 50 L50 125 L70 145 L125 90 L180 145 L200 125 Z" stroke="hsl(var(--primary))" strokeWidth="0.5" fill="none" opacity="0.4" />
        </svg>
        {/* Bottom left small decoration */}
        <svg className="absolute left-[15%] top-[55%] w-[120px] h-[120px] opacity-10" viewBox="0 0 120 120" fill="none">
          <path d="M60 10 L10 60 L25 75 L60 40 L95 75 L110 60 Z" stroke="hsl(var(--primary))" strokeWidth="1" fill="none" />
        </svg>
        {/* Horizontal accent lines */}
        <div className="absolute top-[30%] left-0 w-[15%] h-px bg-gradient-to-r from-transparent via-primary/20 to-primary/5" />
        <div className="absolute top-[35%] right-0 w-[12%] h-px bg-gradient-to-l from-transparent via-primary/15 to-primary/5" />
      </div>

      <div className="container relative z-10 text-center max-w-5xl">
        {/* Badge */}
        <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm mb-8 animate-fade-in">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm text-foreground/90 font-medium">Your Perfect Social Media Marketing Platform</span>
        </div>

        {/* Main headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-bold tracking-tight mb-6 leading-[1.08] animate-fade-in" style={{ animationDelay: '100ms' }}>
          Scale Your Brand Organically
          <br />
          Across Thousands of Creators
        </h1>

        {/* Typewriter subtitle */}
        <p className="text-base sm:text-lg text-muted-foreground mb-10 h-7 animate-fade-in" style={{ animationDelay: '200ms' }}>
          We distribute short-form{" "}
          <span className="text-foreground font-medium">{displayText}</span>
          <span className="typewriter-cursor text-primary font-light">|</span>
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <button
            onClick={() => navigate("/auth")}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-[0_0_25px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_35px_hsl(var(--primary)/0.55)] hover:bg-primary/90 transition-all duration-300 active:scale-[0.98]"
          >
            Join as Creator
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate("/auth")}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-medium text-sm shadow-[0_0_25px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_35px_hsl(var(--primary)/0.55)] hover:bg-primary/90 transition-all duration-300 active:scale-[0.98]"
          >
            Join as Brand
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Dashboard Preview Image */}
        <div className="mt-16 sm:mt-24 animate-fade-in relative max-w-5xl mx-auto" style={{ animationDelay: '400ms' }}>
          {/* Glow behind */}
          <div className="absolute -inset-6 sm:-inset-12 bg-primary/10 blur-[80px] rounded-3xl -z-10" />
          
          <div className="rounded-xl sm:rounded-2xl border border-border/40 overflow-hidden shadow-2xl shadow-primary/10">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/30 bg-card/90">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[hsl(0,84%,60%)]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[hsl(45,93%,58%)]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[hsl(142,71%,45%)]" />
              </div>
              <div className="flex-1 mx-8">
                <div className="bg-secondary/50 rounded-md px-3 py-1 text-xs text-muted-foreground text-center max-w-[200px] mx-auto">
                  amplify.app/dashboard
                </div>
              </div>
            </div>

            {/* Dashboard image */}
            <img 
              src={dashboardPreview} 
              alt="Amplify Dashboard - Analytics and earnings tracking" 
              className="w-full block"
              loading="lazy"
            />
          </div>
        </div>
      </div>

      {/* Platform Marquee */}
      <div className="w-full mt-16 sm:mt-20 pb-8 animate-fade-in" style={{ animationDelay: '500ms' }}>
        <div className="marquee-container overflow-hidden py-4">
          <div className="marquee-track flex gap-14 items-center">
            {[...platformIcons, ...platformIcons, ...platformIcons, ...platformIcons].map((platform, i) => (
              <div key={i} className="flex items-center gap-2.5 text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors flex-shrink-0">
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
