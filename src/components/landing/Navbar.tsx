import { Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = ["Features", "How It Works", "FAQ"];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-xl transition-all duration-300 ${
        scrolled
          ? "bg-background/90 border-border/30 shadow-[0_1px_20px_hsl(var(--primary)/0.1)]"
          : "bg-background/70 border-border/20"
      }`}
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="container flex items-center justify-between h-16 px-4">
        <a href="/" className="flex items-center gap-2.5 group">
          <img src={logo} alt="Amplify" className="w-9 h-9 rounded-lg transition-transform group-hover:scale-105" />
          <span className="font-display font-bold text-xl">Amplify</span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {links.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {item}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center">
          <button
            onClick={() => navigate("/auth")}
            className="btn-shimmer text-sm font-medium px-6 py-2.5 rounded-full bg-primary text-primary-foreground transition-all duration-300 hover:scale-105 shadow-[0_0_15px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_25px_hsl(var(--primary)/0.5)]"
          >
            Get Started
          </button>
        </div>

        <button className="md:hidden p-2 text-muted-foreground hover:text-foreground" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-border/20 bg-background/95 backdrop-blur-xl">
          <div className="container px-4 py-4 space-y-3">
            {links.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                onClick={() => setIsOpen(false)}
              >
                {item}
              </a>
            ))}
            <div className="pt-3 border-t border-border/20">
              <button
                onClick={() => navigate("/auth")}
                className="w-full text-sm font-medium px-5 py-2.5 rounded-full bg-primary text-primary-foreground"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
