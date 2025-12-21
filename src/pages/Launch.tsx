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
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    requirements: "",
    niche: "",
    platforms: [] as PlatformType[],
    rate_value: "",
    rate_unit: "100000",
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

  const handleInputChange = (field: string, value: string | PlatformType[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

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

    if (formData.platforms.length === 0) {
      toast({
        title: "Select platforms",
        description: "Please select at least one platform",
        variant: "destructive",
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a campaign name",
        variant: "destructive",
      });
      return;
    }

    if (!formData.total_budget || parseFloat(formData.total_budget) <= 0) {
      toast({
        title: "Budget required",
        description: "Please enter a valid budget",
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
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        requirements: formData.requirements.trim() || undefined,
        platforms: formData.platforms,
        niche: formData.niche || undefined,
        rate_value: parseFloat(formData.rate_value) || 75,
        rate_unit: parseInt(formData.rate_unit) || 100000,
        min_views: parseInt(formData.min_views) || 1000,
        min_payout_views: parseInt(formData.min_payout_views) || 10000,
        max_earnings_per_post: formData.max_earnings_per_post 
          ? parseFloat(formData.max_earnings_per_post) 
          : undefined,
        total_budget: parseFloat(formData.total_budget),
        duration_days: parseInt(formData.duration_days) || 30,
        required_hashtags: hashtags,
        required_links: links,
        image_url: imageUrl || undefined,
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

        <form onSubmit={handleSubmit}>
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
                  onClick={() => setStep(2)}
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

              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="total_budget">Total Budget *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="total_budget"
                        type="number"
                        placeholder="5000"
                        value={formData.total_budget}
                        onChange={(e) => handleInputChange("total_budget", e.target.value)}
                        required
                        className="h-12 pl-10 bg-secondary border-border"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration_days">Campaign Duration (Days)</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="duration_days"
                        type="number"
                        placeholder="30"
                        value={formData.duration_days}
                        onChange={(e) => handleInputChange("duration_days", e.target.value)}
                        className="h-12 pl-10 bg-secondary border-border"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rate_value">Rate ($ per views)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="rate_value"
                        type="number"
                        step="0.01"
                        placeholder="75"
                        value={formData.rate_value}
                        onChange={(e) => handleInputChange("rate_value", e.target.value)}
                        className="h-12 pl-10 bg-secondary border-border"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rate_unit">Per X Views</Label>
                    <div className="relative">
                      <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="rate_unit"
                        type="number"
                        placeholder="100000"
                        value={formData.rate_unit}
                        onChange={(e) => handleInputChange("rate_unit", e.target.value)}
                        className="h-12 pl-10 bg-secondary border-border"
                      />
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
                        placeholder="1000"
                        value={formData.min_views}
                        onChange={(e) => handleInputChange("min_views", e.target.value)}
                        className="h-12 pl-10 bg-secondary border-border"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="min_payout_views">Minimum Views (for payout)</Label>
                    <div className="relative">
                      <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="min_payout_views"
                        type="number"
                        placeholder="10000"
                        value={formData.min_payout_views}
                        onChange={(e) => handleInputChange("min_payout_views", e.target.value)}
                        className="h-12 pl-10 bg-secondary border-border"
                      />
                    </div>
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
                      placeholder="Leave empty for no limit"
                      value={formData.max_earnings_per_post}
                      onChange={(e) => handleInputChange("max_earnings_per_post", e.target.value)}
                      className="h-12 pl-10 bg-secondary border-border"
                    />
                  </div>
                </div>

                {/* Required Hashtags & Links */}
                <div className="p-4 rounded-lg bg-secondary/50 space-y-4">
                  <h3 className="font-medium text-sm">Smart Requirements (Auto-validation)</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="required_hashtags" className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-primary" />
                      Required Hashtags
                    </Label>
                    <Input
                      id="required_hashtags"
                      placeholder="#gaming, #clips, #viral"
                      value={formData.required_hashtags}
                      onChange={(e) => handleInputChange("required_hashtags", e.target.value)}
                      className="bg-background"
                    />
                    <p className="text-xs text-muted-foreground">
                      Comma-separated. Submissions missing these will be auto-rejected.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="required_links" className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4 text-primary" />
                      Required Links/Mentions
                    </Label>
                    <Input
                      id="required_links"
                      placeholder="@yourbrand, linkin.bio/brand"
                      value={formData.required_links}
                      onChange={(e) => handleInputChange("required_links", e.target.value)}
                      className="bg-background"
                    />
                    <p className="text-xs text-muted-foreground">
                      Comma-separated. Submissions missing these will be auto-rejected.
                    </p>
                  </div>
                </div>

                {/* Info box */}
                <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">How payouts work</p>
                    <p className="text-muted-foreground">
                      Clippers earn based on the views their clips generate. At ${formData.rate_value || "75"} per {parseInt(formData.rate_unit || "100000").toLocaleString()} views, 
                      a clip with 100K views would earn ${((parseFloat(formData.rate_value || "75") / parseInt(formData.rate_unit || "100000")) * 100000).toFixed(2)}.
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
                  onClick={() => setStep(3)}
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
                    <div className="text-sm text-muted-foreground mb-1">Rate</div>
                    <div className="font-medium">
                      ${formData.rate_value || "75"} / {parseInt(formData.rate_unit || "100000").toLocaleString()} views
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
                        <span className="text-sm">{formData.required_hashtags}</span>
                      </div>
                    )}
                    {formData.required_links && (
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-primary" />
                        <span className="text-sm">{formData.required_links}</span>
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
