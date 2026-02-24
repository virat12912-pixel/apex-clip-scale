import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const Contact = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container max-w-3xl px-4 py-12 sm:py-20">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <img src={logo} alt="Amplify" className="w-8 h-8 rounded-md" />
          <h1 className="text-2xl sm:text-3xl font-display font-bold">Contact Us</h1>
        </div>

        <div className="space-y-8">
          {/* Launch CTA */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 space-y-3">
            <h2 className="text-lg font-display font-semibold text-foreground">Want to launch a campaign?</h2>
            <p className="text-sm text-muted-foreground/70 leading-relaxed">
              Click below to fill out our onboarding form. Our team will review your application and get back to you within 24–48 hours.
            </p>
            <Link to="/brand-application">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium mt-2">
                Launch a Campaign
              </Button>
            </Link>
          </div>

          {/* General Support */}
          <div className="rounded-xl border border-border/20 bg-card/50 p-6 space-y-4">
            <h2 className="text-lg font-display font-semibold text-foreground">General Support</h2>
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-foreground/90 font-medium">contact@amplifyclipping.com</p>
                <p className="text-xs text-muted-foreground/50 mt-1">For general inquiries, support requests, and partnership opportunities.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm text-foreground/90 font-medium">24–48 hour response time</p>
                <p className="text-xs text-muted-foreground/50 mt-1">We aim to respond to all inquiries within two business days.</p>
              </div>
            </div>
          </div>

          {/* Existing Clients */}
          <div className="rounded-xl border border-border/20 bg-card/50 p-6 space-y-3">
            <h2 className="text-lg font-display font-semibold text-foreground">Existing Clients</h2>
            <p className="text-sm text-muted-foreground/70 leading-relaxed">
              If you're an existing client, please use the client portal for campaign reviews, content approvals, and performance tracking.
            </p>
            <Link to="/auth" className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors font-medium">
              Open Client Portal <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Partnerships */}
          <div className="rounded-xl border border-border/20 bg-card/50 p-6 space-y-3">
            <h2 className="text-lg font-display font-semibold text-foreground">Partnerships</h2>
            <p className="text-sm text-muted-foreground/70 leading-relaxed">
              Interested in partnering with Amplify? Whether you're a creator network, agency, or platform — reach out and let's explore how we can work together.
            </p>
            <p className="text-sm text-foreground/90 font-medium">partnerships@amplifyclipping.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
