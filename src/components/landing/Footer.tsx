import { forwardRef } from "react";
import { Zap, ExternalLink } from "lucide-react";

const Footer = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  (props, ref) => {
    return (
      <footer ref={ref} className="py-16 px-4 border-t border-border" {...props}>
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Logo & Description */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center glow-primary-sm">
                  <Zap className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-display font-bold text-xl">Amplify</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-sm mb-4">
                Enterprise-grade short-form content platform connecting brands with vetted professional clippers.
              </p>
              <p className="text-xs text-muted-foreground">
                No guaranteed views or sales. All results are organic and performance-based.
              </p>
            </div>

            {/* Platform Links */}
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
                </li>
                <li>
                  <a href="#for-clients" className="hover:text-foreground transition-colors">For Brands</a>
                </li>
                <li>
                  <a href="#for-clippers" className="hover:text-foreground transition-colors">For Clippers</a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
                </li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">Refund Policy</a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">Content Rights</a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Amplify. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                Status <ExternalLink className="w-3 h-3" />
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                Roadmap <ExternalLink className="w-3 h-3" />
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    );
  }
);

Footer.displayName = "Footer";

export default Footer;
