import { useState, useRef } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { 
  DollarSign, 
  Target, 
  Info,
  ArrowRight,
  ArrowLeft,
  Upload,
  X,
  Smartphone,
  Camera,
  Play,
  Hash,
  Link as LinkIcon,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useCreateCampaign } from "@/hooks/useCampaigns";
import { Database } from "@/integrations/supabase/types";
import { mapErrorToUserMessage, logError } from "@/lib/errorMapping";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useClientBalance } from "@/hooks/useClientBalance";
import { AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { campaignSchema, validateCampaignInput } from "@/lib/validation";

type PlatformType = Database["public"]["Enums"]["platform_type"];

const categories = [
  "gaming",
  "fitness",
  "tech",
  "music",
  "food",
  "lifestyle",
  "education",
  "entertainment",
];

const platforms: { id: PlatformType; label: string; icon: React.ReactNode }[] = [
  { id: "tiktok", label: "TikTok", icon: <Smartphone className="h-4 w-4" /> },
  { id: "instagram", label: "Instagram", icon: <Camera className="h-4 w-4" /> },
  { id: "youtube", label: "YouTube", icon: <Play className="h-4 w-4" /> },
];

const Launch = () => {
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { data: clientBalance } = useClientBalance();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    requirements: "",
    niche: "",
    platforms: [] as PlatformType[],
    rate_value: "",
    rate_unit: "1000",
    min_views: "1000",
    min_payout_views: "10000",
    max_earnings_per_post: "",
    total_budget: "",
    duration_days: "30",
    required_hashtags: "",
    required_links: "",
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const createCampaign = useCreateCampaign();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // H-22: the Zod campaign schema is the validation authority — the form
  // must not silently replace bad input with defaults (empty rate -> 75,
  // "abc" budget passing the NaN check) or accept negative numbers.
  const handleInputChange = (field: string, value: string | PlatformType[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const FIELD_LABELS: Record<string, string> = {
    name: "Campaign name",
    platforms: "Platforms",
    rate_value: "RPM",
    min_views: "Minimum views",
    max_earnings_per_post: "Max earnings per post",
    total_budget: "Total budget",
    description: "Description",
    requirements: "Requirements",
    niche: "Category",
    image_url: "Campaign image",
  };

  // Strict number parsing: empty -> undefined (schema reports "required"),
  // non-numeric -> NaN (schema rejects it). No silent `|| default`.
  const parseNumberField = (value: string): number | undefined => {
    const trimmed = value.trim();
    if (trimmed === "") return undefined;
    return Number(trimmed);
  };

  interface ValidatedLaunchValues {
    name: string;
    description?: string;
    requirements?: string;
    niche?: string;
    platforms: PlatformType[];
    rate_value: number;
    rate_unit: number;
    min_views: number;
    min_payout_views: number;
    max_earnings_per_post?: number;
    total_budget: number;
    duration_days: number;
    image_url?: string;
  }

  const validateForm = (): { errors: Record<string, string>; values: ValidatedLaunchValues | null } => {
    const errors: Record<string, string> = {};
    const result = campaignSchema.safeParse({
      name: formData.name,
      description: formData.description || undefined,
      requirements: formData.requirements || undefined,
      niche: formData.niche || undefined,
      platforms: formData.platforms,
      rate_value: parseNumberField(formData.rate_value),
      rate_unit: 1000,
      min_views: parseNumberField(formData.min_views),
      max_earnings_per_post: parseNumberField(formData.max_earnings_per_post),
      total_budget: parseNumberField(formData.total_budget),
      image_url: imageUrl || undefined,
    });
    if (!result.success) {
      for (const issue of result.error.errors) {
        const field = String(issue.path[0] ?? "");
        if (field && !errors[field]) {
          errors[field] =
            issue.code === "invalid_type" && (issue as { received?: string }).received === "undefined"
              ? `${FIELD_LABELS[field] ?? field} is required`
              : issue.message;
        }
      }
    }

    // min_payout_views and duration_days are not in the schema — validate
    // them here with the same strictness (no silent defaults for bad input).
    let minPayoutViews = 10000;
    const mpv = formData.min_payout_views.trim();
    if (mpv !== "") {
      const n = Number(mpv);
      if (!Number.isInteger(n) || n <= 0) {
        errors.min_payout_views = "Minimum payout views must be a whole number greater than 0";
      } else {
        minPayoutViews = n;
      }
    }
    let durationDays = 30;
    const dd = formData.duration_days.trim();
    if (dd !== "") {
      const n = Number(dd);
      if (!Number.isInteger(n) || n <= 0) {
        errors.duration_days = "Campaign duration must be a whole number of days greater than 0";
      } else {
        durationDays = n;
      }
    }

    if (Object.keys(errors).length > 0) return { errors, values: null };
    if (!result.success) return { errors: { _form: "Validation failed" }, values: null };

    return {
      errors,
      values: {
        name: result.data.name,
        description: result.data.description,
        requirements: result.data.requirements,
        niche: result.data.niche,
        platforms: result.data.platforms,
        rate_value: result.data.rate_value,
        rate_unit: result.data.rate_unit,
        min_views: result.data.min_views,
        min_payout_views: minPayoutViews,
        max_earnings_per_post: result.data.max_earnings_per_post,
        total_budget: result.data.total_budget,
        duration_days: durationDays,
        image_url: result.data.image_url,
      },
    };
  };

  const STEP_FIELDS: Record<number, string[]> = {
    1: ["name", "description", "requirements", "niche", "platforms", "image_url"],
    2: ["rate_value", "min_views", "min_payout_views", "max_earnings_per_post", "total_budget", "duration_days"],
  };

  // H-23: advancing validates the current step; creation only happens
  // from step 3 (see handleSubmit).
  const advanceStep = () => {
    const { errors } = validateForm();
    const stepErrors: Record<string, string> = {};
    for (const field of STEP_FIELDS[step] ?? []) {
      if (errors[field]) stepErrors[field] = errors[field];
    }
    setFieldErrors(stepErrors);
    if (Object.keys(stepErrors).length > 0) {
      const first = Object.values(stepErrors)[0];
      toast({ title: "Check your campaign details", description: first, variant: "destructive" });
      return;
    }
    setStep(step + 1);
  };

  // NaN-safe display rate for the "How payouts work" info box.
  const infoRate = Number(formData.rate_value);
  const displayRate = Number.isFinite(infoRate) && infoRate > 0 ? infoRate : 75;

  const togglePlatform = (platform: PlatformType) => {
    const current = formData.platforms;
    if (current.includes(platform)) {
      handleInputChange("platforms", current.filter(p => p !== platform));
    } else {
      handleInputChange("platforms", [...current, platform]);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("campaign-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("campaign-images")
        .getPublicUrl(filePath);

      setImageUrl(publicUrl);
      toast({ title: "Image uploaded!" });
    } catch (error: unknown) {
      logError("Launch:handleImageUpload", error);
      toast({ title: "Upload failed", description: mapErrorToUserMessage(error), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setImageUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // H-23: the campaign is created ONLY from the review step (step 3).
    // A submit event on steps 1–2 (e.g. pressing Enter) advances the
    // wizard instead of launching.
    if (step !== 3) {
      advanceStep();
      return;
    }

    const { errors, values } = validateForm();
    setFieldErrors(errors);
    if (!values) {
      const first = Object.values(errors)[0];
      toast({ title: "Check your campaign details", description: first || "Please fix the highlighted fields", variant: "destructive" });
      return;
    }

    // Final gate through the shared validator — its success yields the
    // sanitized numbers used for the create call (no `|| default`
    // fallbacks that mask bad input). The `in` check (not `!success`) is
    // deliberate: this repo compiles with strictNullChecks off, which
    // disables discriminated-union narrowing on the `success` flag.
    const validated = validateCampaignInput({
      name: values.name,
      description: values.description,
      requirements: values.requirements,
      platforms: values.platforms,
      niche: values.niche,
      rate_value: values.rate_value,
      rate_unit: values.rate_unit,
      min_views: values.min_views,
      max_earnings_per_post: values.max_earnings_per_post,
      total_budget: values.total_budget,
      image_url: values.image_url,
    });
    if ("error" in validated) {
      toast({ title: "Check your campaign details", description: validated.error, variant: "destructive" });
      return;
    }

    const budgetAmount = validated.data.total_budget;
    // C-05: block whenever the budget exceeds the available balance,
    // INCLUDING a $0 balance (the old `availableBalance > 0` guard let a
    // $0-balance brand launch any budget). When no balance row exists at
    // all (clientBalance === null) we do not block here — the server
    // rejects with 409 and its message is surfaced from the catch below.
    if (clientBalance && budgetAmount > Number(clientBalance.available_balance || 0)) {
      toast({
        title: "Insufficient balance",
        description: `Budget ($${budgetAmount}) exceeds your available balance ($${Number(clientBalance.available_balance || 0).toFixed(2)})`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Parse hashtags and links from comma-separated strings
      const hashtags = formData.required_hashtags
        .split(",")
        .map(h => h.trim())
        .filter(h => h.length > 0);

      const links = formData.required_links
        .split(",")
        .map(l => l.trim())
        .filter(l => l.length > 0);

      await createCampaign.mutateAsync({
        name: validated.data.name,
        description: validated.data.description,
        requirements: validated.data.requirements,
        platforms: validated.data.platforms,
        niche: validated.data.niche,
        rate_value: validated.data.rate_value,
        rate_unit: validated.data.rate_unit,
        min_views: validated.data.min_views,
        min_payout_views: values.min_payout_views,
        max_earnings_per_post: validated.data.max_earnings_per_post,
        total_budget: validated.data.total_budget,
        duration_days: values.duration_days,
        required_hashtags: hashtags,
        required_links: links,
        image_url: validated.data.image_url,
      });

      toast({
        title: "Campaign created!",
        description: "Your campaign is now live and visible to clippers.",
      });
      navigate("/campaigns");
    } catch (error: unknown) {
      logError("Launch:handleSubmit", error);
      toast({
        title: "Error creating campaign",
        description: mapErrorToUserMessage(error),
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout title="Launch Campaign">
      <div className="max-w-3xl mx-auto page-enter">
        {/* Progress steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                    step >= s
                      ? "bg-gradient-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-full h-1 mx-2 rounded-full transition-colors ${
                      step > s ? "bg-primary" : "bg-secondary"
                    }`}
                    style={{ width: "100px" }}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Basic Info</span>
            <span>Budget & Requirements</span>
            <span>Review</span>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            // H-23: Enter on steps 1–2 advances the wizard instead of
            // submitting (Enter inside a textarea still inserts a newline).
            if (e.key === "Enter" && step < 3 && (e.target as HTMLElement).tagName !== "TEXTAREA") {
              e.preventDefault();
              advanceStep();
            }
          }}
        >
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6 p-6 rounded-2xl bg-card border border-border">
              <div>
                <h2 className="text-xl font-semibold mb-1">Campaign Details</h2>
                <p className="text-sm text-muted-foreground">
                  Tell clippers what your campaign is about
                </p>
              </div>

              <div className="space-y-4">
                {/* Campaign Image */}
                <div className="space-y-2">
                  <Label>Campaign Image</Label>
                  {imageUrl ? (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
                      <img src={imageUrl} alt="Campaign" className="w-full h-full object-cover" />
                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="absolute top-2 right-2"
                        onClick={removeImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-48 rounded-lg border-2 border-dashed border-border bg-secondary/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      {uploading ? (
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Click to upload campaign image</p>
                          <p className="text-xs text-muted-foreground mt-1">Max 5MB</p>
                        </>
                      )}
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Campaign Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Gaming Highlights Campaign"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                    className="h-12 bg-secondary border-border"
                  />
                  {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what kind of clips you're looking for..."
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    className="min-h-[120px] bg-secondary border-border resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Platforms *</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {platforms.map((platform) => (
                      <button
                        key={platform.id}
                        type="button"
                        onClick={() => togglePlatform(platform.id)}
                        className={`p-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 hover-scale ${
                          formData.platforms.includes(platform.id)
                            ? "bg-primary text-primary-foreground glow-primary-sm"
                            : "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {platform.icon} {platform.label}
                      </button>
                    ))}
                  </div>
                  {fieldErrors.platforms && <p className="text-xs text-destructive">{fieldErrors.platforms}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleInputChange("niche", cat)}
                        className={`p-3 rounded-lg text-sm font-medium transition-colors capitalize ${
                          formData.niche === cat
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requirements">Requirements (Text)</Label>
                  <Textarea
                    id="requirements"
                    placeholder="Any specific requirements or style guidelines for clippers..."
                    value={formData.requirements}
                    onChange={(e) => handleInputChange("requirements", e.target.value)}
                    className="min-h-[100px] bg-secondary border-border resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={advanceStep}
                  disabled={!formData.name || formData.platforms.length === 0}
                  className="bg-gradient-primary hover:opacity-90 btn-glow"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Budget & Requirements */}
          {step === 2 && (
            <div className="space-y-6 p-6 rounded-2xl bg-card border border-border">
              <div>
                <h2 className="text-xl font-semibold mb-1">Budget & Requirements</h2>
                <p className="text-sm text-muted-foreground">
                  Set your budget and submission requirements
                </p>
                    </div>
                    {clientBalance && Number(clientBalance.available_balance) > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Available Balance: <span className="font-bold text-foreground">${Number(clientBalance.available_balance).toFixed(2)}</span></span>
                          {formData.total_budget && parseFloat(formData.total_budget) > Number(clientBalance.available_balance) && (
                            <span className="flex items-center gap-1 text-destructive">
                              <AlertTriangle className="h-3 w-3" />
                              Exceeds balance
                            </span>
                          )}
                        </div>
                        {formData.total_budget && (
                          <Progress 
                            value={Math.min((parseFloat(formData.total_budget) / Number(clientBalance.available_balance)) * 100, 100)} 
                            className="h-1.5"
                          />
                        )}
                      </div>
                    )}

              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="total_budget">Total Budget *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="total_budget"
                        type="number"
                        min={1}
                        placeholder="5000"
                        value={formData.total_budget}
                        onChange={(e) => handleInputChange("total_budget", e.target.value)}
                        required
                        className="h-12 pl-10 bg-secondary border-border"
                      />
                    </div>
                    {fieldErrors.total_budget && <p className="text-xs text-destructive">{fieldErrors.total_budget}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration_days">Campaign Duration (Days)</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="duration_days"
                        type="number"
                        min={1}
                        placeholder="30"
                        value={formData.duration_days}
                        onChange={(e) => handleInputChange("duration_days", e.target.value)}
                        className="h-12 pl-10 bg-secondary border-border"
                      />
                    </div>
                    {fieldErrors.duration_days && <p className="text-xs text-destructive">{fieldErrors.duration_days}</p>}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rate_value">RPM ($ per 1,000 views)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="rate_value"
                        type="number"
                        min={0.01}
                        step="0.01"
                        placeholder="75"
                        value={formData.rate_value}
                        onChange={(e) => handleInputChange("rate_value", e.target.value)}
                        className="h-12 pl-10 bg-secondary border-border"
                      />
                    </div>
                    {fieldErrors.rate_value && <p className="text-xs text-destructive">{fieldErrors.rate_value}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Rate Unit</Label>
                    <div className="h-12 flex items-center px-3 bg-secondary border border-border rounded-md text-muted-foreground text-sm">
                      Per 1,000 views (RPM)
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min_views">Minimum Views (for submission)</Label>
                    <div className="relative">
                      <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="min_views"
                        type="number"
                        min={1}
                        placeholder="1000"
                        value={formData.min_views}
                        onChange={(e) => handleInputChange("min_views", e.target.value)}
                        className="h-12 pl-10 bg-secondary border-border"
                      />
                    </div>
                    {fieldErrors.min_views && <p className="text-xs text-destructive">{fieldErrors.min_views}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="min_payout_views">Minimum Views (for payout)</Label>
                    <div className="relative">
                      <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="min_payout_views"
                        type="number"
                        min={1}
                        placeholder="10000"
                        value={formData.min_payout_views}
                        onChange={(e) => handleInputChange("min_payout_views", e.target.value)}
                        className="h-12 pl-10 bg-secondary border-border"
                      />
                    </div>
                    {fieldErrors.min_payout_views && <p className="text-xs text-destructive">{fieldErrors.min_payout_views}</p>}
                    <p className="text-xs text-muted-foreground">
                      Submissions below this won't appear in payout queue
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_earnings_per_post">Max Earnings Per Post (optional)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="max_earnings_per_post"
                      type="number"
                      min={0.01}
                      step="0.01"
                      placeholder="Leave empty for no limit"
                      value={formData.max_earnings_per_post}
                      onChange={(e) => handleInputChange("max_earnings_per_post", e.target.value)}
                      className="h-12 pl-10 bg-secondary border-border"
                    />
                  </div>
                  {fieldErrors.max_earnings_per_post && <p className="text-xs text-destructive">{fieldErrors.max_earnings_per_post}</p>}
                </div>

                 {/* Caption and profile-link requirements */}
                <div className="p-4 rounded-lg bg-secondary/50 space-y-4">
                  <h3 className="font-medium text-sm">Smart Requirements (Auto-validation)</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="required_hashtags" className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-primary" />
                       Required Caption Text
                    </Label>
                    <Input
                      id="required_hashtags"
                       placeholder="#gaming, @yourbrand, campaign name"
                      value={formData.required_hashtags}
                      onChange={(e) => handleInputChange("required_hashtags", e.target.value)}
                      className="bg-background"
                    />
                    <p className="text-xs text-muted-foreground">
                       Comma-separated hashtags, mentions, or words. Each item must appear in the full video caption.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="required_links" className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4 text-primary" />
                       Required Clickable Bio Link
                    </Label>
                    <Input
                      id="required_links"
                       placeholder="https://yourbrand.com/offer"
                      value={formData.required_links}
                      onChange={(e) => handleInputChange("required_links", e.target.value)}
                      className="bg-background"
                    />
                    <p className="text-xs text-muted-foreground">
                       The required link must be in the account’s clickable profile link area, not typed into the caption. TikTok accounts below 1,000 followers are exempt.
                    </p>
                  </div>
                </div>

                {/* Info box */}
                <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">How payouts work</p>
                    <p className="text-muted-foreground">
                      Clippers earn based on the views their clips generate. At an RPM of ${displayRate},
                      a clip with 100K views would earn ${((displayRate / 1000) * 100000).toFixed(2)}.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={advanceStep}
                  disabled={!formData.total_budget}
                  className="bg-gradient-primary hover:opacity-90 btn-glow"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-6 p-6 rounded-2xl bg-card border border-border">
              <div>
                <h2 className="text-xl font-semibold mb-1">Review & Launch</h2>
                <p className="text-sm text-muted-foreground">
                  Review your campaign details before going live
                </p>
              </div>

              <div className="space-y-4 stagger-enter">
                {imageUrl && (
                  <div className="w-full h-48 rounded-lg overflow-hidden">
                    <img src={imageUrl} alt="Campaign" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="p-4 rounded-lg bg-secondary/50">
                  <div className="text-sm text-muted-foreground mb-1">Campaign Name</div>
                  <div className="font-medium">{formData.name || "Not set"}</div>
                </div>

                <div className="p-4 rounded-lg bg-secondary/50">
                  <div className="text-sm text-muted-foreground mb-1">Platforms</div>
                  <div className="flex gap-2">
                    {formData.platforms.map((p) => (
                      <span key={p} className="px-2 py-1 rounded bg-primary/10 text-primary text-sm capitalize flex items-center gap-1">
                        {platforms.find(pl => pl.id === p)?.icon}
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-secondary/50">
                  <div className="text-sm text-muted-foreground mb-1">Description</div>
                  <div className="font-medium">{formData.description || "Not set"}</div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <div className="text-sm text-muted-foreground mb-1">Category</div>
                    <div className="font-medium capitalize">{formData.niche || "Not set"}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <div className="text-sm text-muted-foreground mb-1">Duration</div>
                    <div className="font-medium">{formData.duration_days} days</div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="text-sm text-muted-foreground mb-1">Total Budget</div>
                    <div className="font-bold text-primary text-lg">
                      ${formData.total_budget || "0"}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <div className="text-sm text-muted-foreground mb-1">RPM</div>
                    <div className="font-medium">
                      ${formData.rate_value || "75"} / 1K views
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <div className="text-sm text-muted-foreground mb-1">Min Payout Views</div>
                    <div className="font-medium">
                      {parseInt(formData.min_payout_views || "10000").toLocaleString()}
                    </div>
                  </div>
                </div>

                {(formData.required_hashtags || formData.required_links) && (
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <div className="text-sm text-muted-foreground mb-2">Requirements</div>
                    {formData.required_hashtags && (
                      <div className="flex items-center gap-2 mb-2">
                        <Hash className="h-4 w-4 text-primary" />
                        <span className="text-sm">Caption: {formData.required_hashtags}</span>
                      </div>
                    )}
                    {formData.required_links && (
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-primary" />
                        <span className="text-sm">Bio link: {formData.required_links}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={createCampaign.isPending}
                  className="bg-gradient-primary hover:opacity-90 btn-glow"
                >
                  {createCampaign.isPending ? "Creating..." : "Launch Campaign"}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </AppLayout>
  );
};

export default Launch;
