import { Menu, X, Zap } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 bg-background/80 backdrop-blur-xl">
      <div className="container flex items-center justify-between h-16 px-4">
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center transition-transform group-hover:scale-105">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl">Amplify</span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {["How It Works", "Testimonials", "Features", "FAQ"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {item}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => navigate("/auth")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
          >
            Log In
          </button>
          <button
            onClick={() => navigate("/auth")}
            className="text-sm font-medium px-5 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-[0_0_15px_hsl(var(--primary)/0.3)]"
          >
            Get Started
          </button>
        </div>

        <button className="md:hidden p-2 text-muted-foreground hover:text-foreground" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-border/30 bg-background/95 backdrop-blur-xl">
          <div className="container px-4 py-4 space-y-3">
            {["How It Works", "Testimonials", "Features", "FAQ"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                onClick={() => setIsOpen(false)}
              >
                {item}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-3 border-t border-border/30">
              <button onClick={() => navigate("/auth")} className="text-sm text-muted-foreground hover:text-foreground py-2">
                Log In
              </button>
              <button
                onClick={() => navigate("/auth")}
                className="text-sm font-medium px-5 py-2.5 rounded-full bg-primary text-primary-foreground"
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
