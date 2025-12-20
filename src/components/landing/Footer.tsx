import { forwardRef } from "react";

const Footer = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  (props, ref) => {
    return (
      <footer ref={ref} className="py-12 px-4 border-t border-border" {...props}>
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">A</span>
              </div>
              <span className="font-display font-bold text-lg">Apex Clipping</span>
            </div>

            {/* Links */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-foreground transition-colors">
                Contact
              </a>
            </div>

            {/* Copyright */}
            <p className="text-sm text-muted-foreground">
              © 2024 Apex Clipping. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    );
  }
);

Footer.displayName = "Footer";

export default Footer;
