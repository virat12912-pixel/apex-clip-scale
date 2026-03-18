import { forwardRef } from "react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";

const Footer = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  (props, ref) => {
    return (
      <footer ref={ref} className="border-t border-border/20" {...props}>
        {/* Main Footer */}
        <div className="container py-12 sm:py-16 px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
            {/* Brand Section */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center gap-2">
                <img src={logo} alt="Amplify" className="w-8 h-8 rounded-md" />
                <span className="font-display font-bold text-lg">Amplify</span>
              </div>
              <p className="text-sm text-muted-foreground/70 leading-relaxed max-w-xs">
                Performance-driven short-form growth for creators and brands.
              </p>
              <p className="text-xs text-muted-foreground/50">
                clippingamplify@gmail.com
              </p>

              {/* Social */}
              <div className="pt-2 space-y-2">
                <p className="text-xs text-muted-foreground/40 uppercase tracking-wider font-medium">
                  Follow Amplify
                </p>
                <div className="flex items-center gap-3">
                  <a
                    href="https://instagram.com/amplifyclipping"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground/50 hover:text-primary transition-colors"
                    aria-label="Instagram"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                  </a>
                  <a
                    href="https://x.com/amplifyclipping"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground/50 hover:text-primary transition-colors"
                    aria-label="X"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                </div>
                <p className="text-[10px] text-muted-foreground/30">
                  Content distributed across major short-form platforms
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div className="space-y-4">
              <h4 className="text-xs text-muted-foreground/40 uppercase tracking-wider font-medium">
                Platform
              </h4>
              <nav className="flex flex-col gap-2.5">
                <a href="#campaigns" className="text-sm text-muted-foreground/60 hover:text-foreground transition-colors">
                  Campaigns
                </a>
                <a href="#how-it-works" className="text-sm text-muted-foreground/60 hover:text-foreground transition-colors">
                  How It Works
                </a>
                <a href="#faq" className="text-sm text-muted-foreground/60 hover:text-foreground transition-colors">
                  FAQ
                </a>
                <Link to="/auth" className="text-sm text-muted-foreground/60 hover:text-foreground transition-colors">
                  Client Portal Login
                </Link>
              </nav>
            </div>

            {/* Resources & Trust */}
            <div className="space-y-4">
              <h4 className="text-xs text-muted-foreground/40 uppercase tracking-wider font-medium">
                Resources
              </h4>
              <nav className="flex flex-col gap-2.5">
                <Link to="/terms" className="text-sm text-muted-foreground/60 hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
                <Link to="/privacy" className="text-sm text-muted-foreground/60 hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
                <Link to="/contact" className="text-sm text-muted-foreground/60 hover:text-foreground transition-colors">
                  Contact Us
                </Link>
                <a href="#faq" className="text-sm text-muted-foreground/60 hover:text-foreground transition-colors">
                  FAQ
                </a>
              </nav>
            </div>

            {/* CTA */}
            <div className="space-y-4">
              <h4 className="text-xs text-muted-foreground/40 uppercase tracking-wider font-medium">
                Get Started
              </h4>
              <p className="text-sm text-muted-foreground/60 leading-relaxed">
                Ready to scale your brand with short-form content? Launch your first campaign today.
              </p>
              <Link to="/brand-application">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium w-full sm:w-auto">
                  Launch a Campaign
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="border-t border-border/10">
          <div className="container px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground/40">
              © {new Date().getFullYear()} Amplify. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground/40">
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
    );
  }
);

Footer.displayName = "Footer";

export default Footer;
