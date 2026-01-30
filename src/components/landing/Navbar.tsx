import { Button } from "@/components/ui/button";
import { Menu, X, Zap } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
      <div className="container flex items-center justify-between h-16 px-4">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center glow-primary-sm transition-transform group-hover:scale-105">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl">Amplify</span>
        </a>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors relative group">
            How It Works
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
          </a>
          <a href="#for-clients" className="text-sm text-muted-foreground hover:text-foreground transition-colors relative group">
            For Clients
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
          </a>
          <a href="#for-clippers" className="text-sm text-muted-foreground hover:text-foreground transition-colors relative group">
            For Clippers
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
          </a>
          <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors relative group">
            Pricing
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
          </a>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="hover:bg-secondary">
            Log In
          </Button>
          <Button size="sm" variant="glow" onClick={() => navigate("/auth")}>
            Start a Campaign
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-border glass-card">
          <div className="container px-4 py-4 space-y-4">
            <a href="#how-it-works" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </a>
            <a href="#for-clients" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
              For Clients
            </a>
            <a href="#for-clippers" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
              For Clippers
            </a>
            <a href="#pricing" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
            <div className="flex flex-col gap-2 pt-4 border-t border-border">
              <Button variant="ghost" className="w-full justify-center" onClick={() => navigate("/auth")}>
                Log In
              </Button>
              <Button variant="glow" className="w-full" onClick={() => navigate("/auth")}>
                Start a Campaign
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
