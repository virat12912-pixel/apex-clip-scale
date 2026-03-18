import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Building2, CheckCircle, Clock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMyBrandApplication, useCreateBrandApplication } from "@/hooks/useBrandApplications";
import { z } from "zod";

const applicationSchema = z.object({
  company_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  campaign_goals: z.string().min(20, "Please describe your goals in at least 20 characters"),
});

const BrandApplication = () => {
  const { profile } = useAuth();
  const { data: existingApplication, isLoading } = useMyBrandApplication();
  const createApplication = useCreateBrandApplication();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    company_name: "",
    email: profile?.email || "",
    campaign_goals: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      applicationSchema.parse(formData);
      setErrors({});
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) newErrors[e.path[0] as string] = e.message;
        });
        setErrors(newErrors);
        return;
      }
    }

    try {
      await createApplication.mutateAsync(formData);
      toast({
        title: "Application submitted!",
        description: "Our team will review and reach out within 24-48 hours.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (existingApplication) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_50%)]" />
        <div className="max-w-md w-full text-center relative z-10 page-enter">
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${
            existingApplication.status === "approved"
              ? "bg-emerald-500/10"
              : existingApplication.status === "rejected"
              ? "bg-red-500/10"
              : "bg-primary/10"
          }`}>
            {existingApplication.status === "approved" ? (
              <CheckCircle className="h-10 w-10 text-emerald-400" />
            ) : existingApplication.status === "rejected" ? (
              <Building2 className="h-10 w-10 text-red-400" />
            ) : (
              <Clock className="h-10 w-10 text-primary" />
            )}
          </div>

          <h1 className="text-2xl font-display font-bold mb-2">
            {existingApplication.status === "approved"
              ? "Application Approved!"
              : existingApplication.status === "rejected"
              ? "Application Not Approved"
              : "Application Under Review"}
          </h1>

          <p className="text-muted-foreground mb-6">
            {existingApplication.status === "approved"
              ? "Congratulations! You can now launch campaigns."
              : existingApplication.status === "rejected"
              ? "Unfortunately, your application was not approved at this time."
              : "Thanks for applying! Our team will review your application within 24-48 hours."}
          </p>

          {existingApplication.status === "approved" ? (
            <Button asChild className="bg-gradient-primary rounded-xl font-display font-bold btn-shimmer">
              <Link to="/launch">Launch Your First Campaign</Link>
            </Button>
          ) : (
            <Button asChild variant="outline" className="rounded-xl border-border/30">
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_50%)]" />
      <div className="max-w-lg w-full relative z-10 page-enter">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary glow-primary-sm flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Brand Application</h1>
            <p className="text-muted-foreground">Apply to launch campaigns</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-card/50 border border-border/30">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="company_name">Your Name</Label>
              <Input
                id="company_name"
                placeholder="Your full name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className={`h-12 bg-card/50 border-border/30 rounded-xl ${errors.company_name ? "border-destructive" : ""}`}
              />
              {errors.company_name && (
                <p className="text-xs text-destructive">{errors.company_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Contact Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`h-12 bg-card/50 border-border/30 rounded-xl ${errors.email ? "border-destructive" : ""}`}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign_goals">Campaign Goals</Label>
              <Textarea
                id="campaign_goals"
                placeholder="Tell us about your brand and what you're looking to achieve with clip campaigns..."
                value={formData.campaign_goals}
                onChange={(e) => setFormData({ ...formData, campaign_goals: e.target.value })}
                className={`min-h-[120px] bg-card/50 border-border/30 rounded-xl resize-none ${
                  errors.campaign_goals ? "border-destructive" : ""
                }`}
              />
              {errors.campaign_goals && (
                <p className="text-xs text-destructive">{errors.campaign_goals}</p>
              )}
            </div>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">What happens next?</strong>
                <br />
                Our team will review your application and reach out within 24-48 hours. Once
                approved, you'll be able to launch campaigns immediately.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-primary hover:opacity-90 rounded-xl font-display font-bold btn-shimmer glow-primary-sm"
              disabled={createApplication.isPending}
            >
              {createApplication.isPending ? "Submitting..." : "Submit Application"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BrandApplication;
