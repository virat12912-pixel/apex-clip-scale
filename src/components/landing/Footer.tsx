import { forwardRef } from "react";
import logo from "@/assets/logo.png";

const Footer = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  (props, ref) => {
    return (
      <footer ref={ref} className="py-10 px-4 border-t border-border/20" {...props}>
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-2">
              <img src={logo} alt="Amplify" className="w-7 h-7 rounded-md" />
              <span className="font-display font-bold text-base">Amplify</span>
            </div>

            <div className="flex items-center gap-6 text-xs text-muted-foreground/60 flex-wrap justify-center">
              <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
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
