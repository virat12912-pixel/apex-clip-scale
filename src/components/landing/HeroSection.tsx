import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import { Eye, Users, TrendingUp } from "lucide-react";

const words = ["Revenue", "Growth", "Impact"];

const stats = [
  { icon: Eye, value: "2.4M+", label: "Views Delivered" },
  { icon: Users, value: "500+", label: "Active Creators" },
  { icon: TrendingUp, value: "98%", label: "Payout Rate" },
];

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const platforms = [
  { icon: TikTokIcon, name: "TikTok" },
  { icon: InstagramIcon, name: "Instagram" },
  { icon: YouTubeIcon, name: "YouTube" },
];

const HeroSection = () => {
  const navigate = useNavigate();
  const [wordIndex, setWordIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  // Word morph cycle
  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % words.length);
        setIsVisible(true);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Cursor glow
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }, []);

  return (
    <section
      ref={heroRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden px-4 pt-24 pb-16"
    >
      {/* Animated mesh background */}
      <div className="mesh-bg" />

      {/* Cursor glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30 transition-opacity duration-500"
        style={{
          background: `radial-gradient(400px circle at ${mousePos.x}% ${mousePos.y}%, hsl(267 89% 59% / 0.1), transparent 60%)`,
        }}
      />

      <div className="container relative z-10 text-center max-w-4xl">
        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 leading-[1.05] opacity-0 animate-fade-up">
          Turn Views Into
          <br />
          <span
            className={`gradient-word inline-block transition-all duration-400 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            {words[wordIndex]}
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className="text-base sm:text-lg text-muted-foreground mb-12 max-w-lg mx-auto opacity-0 animate-fade-up"
          style={{ animationDelay: "150ms" }}
        >
          The platform where creators, streamers, musicians, and brands grow together.
        </p>

        {/* CTAs */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-fade-up"
          style={{ animationDelay: "300ms" }}
        >
          <button
            onClick={() => navigate("/auth")}
            className="btn-shimmer w-full sm:w-auto px-10 py-4 rounded-full bg-primary text-primary-foreground font-medium text-sm transition-all duration-300 hover:scale-105 active:scale-[0.98] shadow-[0_0_30px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_50px_hsl(var(--primary)/0.6)]"
          >
            Start Clipping
          </button>
          <button
            onClick={() => navigate("/brand-application")}
            className="w-full sm:w-auto px-10 py-4 rounded-full border border-primary/30 text-foreground font-medium text-sm transition-all duration-300 hover:border-primary/60 hover:shadow-[0_0_20px_hsl(var(--primary)/0.2)] hover:scale-105 active:scale-[0.98]"
          >
            Launch a Campaign →
          </button>
        </div>

        {/* Floating stat cards */}
        <div
          className="mt-20 sm:mt-28 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-2xl mx-auto opacity-0 animate-fade-up"
          style={{ animationDelay: "500ms" }}
        >
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`glass-card rounded-2xl p-6 text-center transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_hsl(var(--primary)/0.15)] ${
                i === 0 ? "float" : i === 1 ? "float-delayed" : "float-delayed-2"
              }`}
            >
              <stat.icon className="w-5 h-5 text-primary mx-auto mb-3" />
              <p className="text-2xl sm:text-3xl font-bold text-foreground mb-1">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Platform icons */}
        <div
          className="mt-14 flex items-center justify-center gap-8 opacity-0 animate-fade-up"
          style={{ animationDelay: "650ms" }}
        >
          <span className="text-xs text-muted-foreground/50 uppercase tracking-widest">Works with</span>
          {platforms.map((p) => (
            <div
              key={p.name}
              className="flex items-center gap-2 text-muted-foreground/40 hover:text-primary/70 transition-all duration-300 hover:drop-shadow-[0_0_8px_hsl(var(--primary)/0.4)]"
            >
              <p.icon />
              <span className="text-xs font-medium hidden sm:inline">{p.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
