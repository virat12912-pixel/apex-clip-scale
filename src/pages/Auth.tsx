import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Eye, EyeOff, ArrowLeft, Shield, TrendingUp } from "lucide-react";
import logo from "@/assets/logo.png";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
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

  if (user) return null;

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
          toast({ title: "Error signing in", description: error.message === "Invalid login credentials" ? "Invalid email or password. Please try again." : error.message, variant: "destructive" });
          return;
        }
        toast({ title: "Welcome back!", description: "Redirecting to dashboard..." });
        navigate(from, { replace: true });
      } else {
        const { error } = await signUp(email, password, name, role);
        if (error) {
          toast({ title: "Error creating account", description: error.message.includes("already registered") ? "This email is already registered. Please sign in instead." : error.message, variant: "destructive" });
          return;
        }
        toast({ title: "Account created!", description: role === "brand" ? "Redirecting to brand application..." : "Redirecting to dashboard..." });
        navigate(role === "brand" ? "/brand-application" : "/dashboard", { replace: true });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm animate-fade-up">
          {/* Back to home */}
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground/60 hover:text-foreground transition-colors duration-200 mb-8 group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
            Back to home
          </Link>

          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-10">
            <img src={logo} alt="Amplify" className="w-11 h-11 rounded-xl" />
            <span className="font-display font-bold text-2xl tracking-tight">Amplify</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold mb-2 tracking-tight">
              {isLogin ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-muted-foreground/60">
              {isLogin 
                ? "Enter your credentials to access your account" 
                : "Start earning or scaling your content today"
              }
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm text-muted-foreground">Full Name</Label>
                  <Input id="name" type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required={!isLogin} className="h-12 bg-card/50 border-border/30 rounded-xl focus:border-primary/40 focus:bg-card transition-all duration-200" />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">I want to...</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole("creator")}
                      className={`p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                        role === "creator"
                          ? "border-primary bg-primary/10 shadow-[0_0_20px_hsl(267_89%_59%/0.15)]"
                          : "border-border/30 hover:border-primary/30 hover:bg-primary/5"
                      }`}
                    >
                      <div className="font-display font-bold mb-1">Create Clips</div>
                      <div className="text-xs text-muted-foreground/60">Earn money by clipping content</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("brand")}
                      className={`p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                        role === "brand"
                          ? "border-primary bg-primary/10 shadow-[0_0_20px_hsl(267_89%_59%/0.15)]"
                          : "border-border/30 hover:border-primary/30 hover:bg-primary/5"
                      }`}
                    >
                      <div className="font-display font-bold mb-1">Launch Campaigns</div>
                      <div className="text-xs text-muted-foreground/60">Scale your content reach</div>
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-muted-foreground">Email</Label>
              <Input
                id="email" type="email" placeholder="you@example.com" value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: undefined })); }}
                required
                className={`h-12 bg-card/50 border-border/30 rounded-xl focus:border-primary/40 focus:bg-card transition-all duration-200 ${errors.email ? "border-destructive" : ""}`}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-muted-foreground">Password</Label>
              <div className="relative">
                <Input
                  id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: undefined })); }}
                  required
                  className={`h-12 bg-card/50 border-border/30 rounded-xl pr-12 focus:border-primary/40 focus:bg-card transition-all duration-200 ${errors.password ? "border-destructive" : ""}`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors duration-200">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <button type="button" onClick={handleForgotPassword} className="text-sm text-primary/70 hover:text-primary transition-colors duration-200">
                  Forgot password?
                </button>
              </div>
            )}

            <Button
              type="submit" size="lg"
              className="w-full h-12 bg-gradient-primary hover:opacity-90 transition-all duration-300 glow-primary-sm btn-shimmer rounded-xl font-display font-bold text-base"
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

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/30" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-3 text-muted-foreground/50">or continue with</span>
            </div>
          </div>

          {/* Google Sign In */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 rounded-xl border-border/30 bg-card/50 hover:bg-card transition-all duration-200 font-medium"
            onClick={async () => {
              setIsLoading(true);
              try {
                const { error } = await lovable.auth.signInWithOAuth("google", {
                  redirect_uri: window.location.origin,
                });
                if (error) {
                  toast({ title: "Error", description: error.message, variant: "destructive" });
                }
              } catch (err: any) {
                toast({ title: "Error", description: err.message, variant: "destructive" });
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </Button>

          <p className="mt-8 text-center text-muted-foreground/60">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setErrors({}); }}
              className="text-primary hover:underline font-semibold"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>

      {/* Right side - Visual */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        {/* Animated mesh background */}
        <div className="absolute inset-0 mesh-bg" />
        
        {/* Background glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[600px] h-[600px] rounded-full bg-primary/15 blur-[150px] animate-pulse-glow" />
        </div>

        {/* Dot grid overlay */}
        <div className="absolute inset-0 dot-grid opacity-30" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16">
          <h2 className="text-5xl font-display font-bold mb-5 leading-tight">
            <span className="text-gradient">Enterprise-Grade</span><br />
            Content Scaling
          </h2>
          <p className="text-lg text-muted-foreground/60 mb-10 max-w-md">
            Connect with vetted clippers, scale content professionally, and track everything with enterprise analytics.
          </p>

          {/* Trust signals */}
          <div className="space-y-5 mb-10">
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-display font-bold">Full Approval Control</div>
                <div className="text-sm text-muted-foreground/50">Review every clip before it goes live</div>
              </div>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-display font-bold">Real-Time Analytics</div>
                <div className="text-sm text-muted-foreground/50">Track performance across all platforms</div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-card/30 border border-border/20 backdrop-blur-sm transition-all duration-300 hover:border-primary/20 hover:bg-card/50">
              <div className="text-3xl font-display font-bold text-primary mb-1">2,400+</div>
              <div className="text-sm text-muted-foreground/50">Vetted Clippers</div>
            </div>
            <div className="p-5 rounded-2xl bg-card/30 border border-border/20 backdrop-blur-sm transition-all duration-300 hover:border-primary/20 hover:bg-card/50">
              <div className="text-3xl font-display font-bold text-primary mb-1">$890K+</div>
              <div className="text-sm text-muted-foreground/50">Paid to Clippers</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
