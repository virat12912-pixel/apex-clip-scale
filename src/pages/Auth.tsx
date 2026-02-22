import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Eye, EyeOff, ArrowLeft, Zap, Shield, TrendingUp, Sparkles } from "lucide-react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const emailSchema = z.string().email("Invalid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

type RoleType = "creator" | "brand";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<RoleType>("creator");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { signIn, signUp, user, isLoading: authLoading } = useAuth();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/dashboard";

  useEffect(() => {
    if (user && !authLoading) {
      navigate(from, { replace: true });
    }
  }, [user, authLoading, from, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return null;
  }

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    try { emailSchema.parse(email); } catch { newErrors.email = "Invalid email address"; }
    try { passwordSchema.parse(password); } catch { newErrors.password = "Password must be at least 6 characters"; }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ title: "Enter your email", description: "Please enter your email address first", variant: "destructive" });
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({ title: "Check your email", description: "We've sent you a password reset link." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Error signing in",
            description: error.message === "Invalid login credentials" 
              ? "Invalid email or password. Please try again."
              : error.message,
            variant: "destructive",
          });
          return;
        }
        toast({ title: "Welcome back!", description: "Redirecting to dashboard..." });
        navigate(from, { replace: true });
      } else {
        const { error } = await signUp(email, password, name, role);
        if (error) {
          toast({
            title: "Error creating account",
            description: error.message.includes("already registered")
              ? "This email is already registered. Please sign in instead."
              : error.message,
            variant: "destructive",
          });
          return;
        }
        toast({
          title: "Account created!",
          description: role === "brand" ? "Redirecting to brand application..." : "Redirecting to dashboard...",
        });
        navigate(role === "brand" ? "/brand-application" : "/dashboard", { replace: true });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/[0.04] rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-primary/[0.03] rounded-full blur-[120px]" />
      </div>

      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 relative z-10">
        <div className="mx-auto w-full max-w-sm">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all duration-300 mb-8 group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to home
          </Link>

          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-8 opacity-0 animate-fade-up" style={{ animationDelay: "0ms" }}>
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center glow-primary-sm">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-2xl tracking-tight">Amplify</span>
          </div>

          {/* Header */}
          <div className="mb-8 opacity-0 animate-fade-up" style={{ animationDelay: "100ms" }}>
            <h1 className="text-3xl font-bold mb-2 tracking-tight">
              {isLogin ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-muted-foreground">
              {isLogin 
                ? "Enter your credentials to access your account" 
                : "Start earning or scaling your content today"
              }
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 opacity-0 animate-fade-up" style={{ animationDelay: "200ms" }}>
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLogin}
                    className="h-12 bg-secondary/50 border-border/50 input-focus-glow transition-all duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label>I want to...</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole("creator")}
                      className={`p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                        role === "creator"
                          ? "border-primary bg-primary/10 shadow-[0_0_20px_hsl(var(--primary)/0.15)]"
                          : "border-border/50 hover:border-primary/30 hover:bg-primary/5"
                      }`}
                    >
                      <Sparkles className={`h-4 w-4 mb-2 transition-colors ${role === "creator" ? "text-primary" : "text-muted-foreground"}`} />
                      <div className="font-semibold mb-1 text-sm">Create Clips</div>
                      <div className="text-xs text-muted-foreground">Earn money by clipping content</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("brand")}
                      className={`p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                        role === "brand"
                          ? "border-primary bg-primary/10 shadow-[0_0_20px_hsl(var(--primary)/0.15)]"
                          : "border-border/50 hover:border-primary/30 hover:bg-primary/5"
                      }`}
                    >
                      <TrendingUp className={`h-4 w-4 mb-2 transition-colors ${role === "brand" ? "text-primary" : "text-muted-foreground"}`} />
                      <div className="font-semibold mb-1 text-sm">Launch Campaigns</div>
                      <div className="text-xs text-muted-foreground">Scale your content reach</div>
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors(prev => ({ ...prev, email: undefined }));
                }}
                required
                className={`h-12 bg-secondary/50 border-border/50 input-focus-glow transition-all duration-300 ${errors.email ? "border-destructive" : ""}`}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors(prev => ({ ...prev, password: undefined }));
                  }}
                  required
                  className={`h-12 bg-secondary/50 border-border/50 pr-12 input-focus-glow transition-all duration-300 ${errors.password ? "border-destructive" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  className="text-sm text-primary hover:underline transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full h-12 btn-shimmer bg-gradient-primary hover:opacity-90 transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)] active:scale-[0.98]"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  {isLogin ? "Signing in..." : "Creating account..."}
                </span>
              ) : (
                <>
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          {/* Toggle */}
          <p className="mt-6 text-center text-muted-foreground opacity-0 animate-fade-up" style={{ animationDelay: "300ms" }}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className="text-primary hover:underline font-medium transition-colors"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>

      {/* Right side - Visual */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        {/* Animated mesh background */}
        <div className="absolute inset-0">
          <div className="mesh-bg" />
          <div className="absolute inset-0 dot-grid opacity-20" />
        </div>

        {/* Background glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[500px] h-[500px] rounded-full bg-primary/15 blur-[120px] animate-pulse-glow" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="opacity-0 animate-fade-up" style={{ animationDelay: "400ms" }}>
            <h2 className="text-4xl font-display font-bold mb-4 tracking-tight">
              <span className="gradient-word">Enterprise-Grade</span>
              <br />
              Content Scaling
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-md">
              Connect with vetted clippers, scale content professionally, and track everything with enterprise analytics.
            </p>
          </div>

          {/* Trust signals */}
          <div className="space-y-4 mb-10 opacity-0 animate-fade-up" style={{ animationDelay: "550ms" }}>
            <div className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:bg-primary/20 group-hover:shadow-[0_0_15px_hsl(var(--primary)/0.3)]">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-medium">Full Approval Control</div>
                <div className="text-sm text-muted-foreground">Review every clip before it goes live</div>
              </div>
            </div>
            <div className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:bg-primary/20 group-hover:shadow-[0_0_15px_hsl(var(--primary)/0.3)]">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-medium">Real-Time Analytics</div>
                <div className="text-sm text-muted-foreground">Track performance across all platforms</div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-6 opacity-0 animate-fade-up" style={{ animationDelay: "700ms" }}>
            <div className="p-4 rounded-xl glass-card hover:border-primary/30 transition-all duration-300 hover:shadow-[0_0_20px_hsl(var(--primary)/0.1)]">
              <div className="text-3xl font-bold text-primary mb-1">2,400+</div>
              <div className="text-sm text-muted-foreground">Vetted Clippers</div>
            </div>
            <div className="p-4 rounded-xl glass-card hover:border-primary/30 transition-all duration-300 hover:shadow-[0_0_20px_hsl(var(--primary)/0.1)]">
              <div className="text-3xl font-bold text-primary mb-1">$890K+</div>
              <div className="text-sm text-muted-foreground">Paid to Clippers</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
