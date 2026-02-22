import { forwardRef } from "react";
import { Zap } from "lucide-react";

const Footer = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  (props, ref) => {
    return (
      <footer ref={ref} className="py-10 px-4 border-t border-border/20" {...props}>
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-gradient-primary flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-base">Amplify</span>
            </div>

            <div className="flex items-center gap-6 text-xs text-muted-foreground/60 flex-wrap justify-center">
              <a href="#launch-a-campaign" className="hover:text-foreground transition-colors">Launch a Campaign</a>
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#testimonials" className="hover:text-foreground transition-colors">Testimonials</a>
              <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
              <a href="/brand-application" className="hover:text-foreground transition-colors">I'm a Brand</a>
              <a href="/auth" className="hover:text-foreground transition-colors">I'm a Creator</a>
            </div>

            <p className="text-xs text-muted-foreground/40">
              © {new Date().getFullYear()} Amplify. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    );
  }
);

Footer.displayName = "Footer";

export default Footer;
