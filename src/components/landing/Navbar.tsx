import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container flex items-center justify-between h-16 px-4">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">A</span>
          </div>
          <span className="font-display font-bold text-lg">Apex Clipping</span>
        </a>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            How It Works
          </a>
          <a href="#for-creators" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            For Creators
          </a>
          <a href="#for-clippers" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            For Clippers
          </a>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="sm">
            Log In
          </Button>
          <Button size="sm" className="bg-gradient-primary hover:opacity-90">
            Get Started
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-lg">
          <div className="container px-4 py-4 space-y-4">
            <a href="#how-it-works" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </a>
            <a href="#for-creators" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
              For Creators
            </a>
            <a href="#for-clippers" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">
              For Clippers
            </a>
            <div className="flex flex-col gap-2 pt-4 border-t border-border">
              <Button variant="ghost" className="w-full justify-center">
                Log In
              </Button>
              <Button className="w-full bg-gradient-primary hover:opacity-90">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
