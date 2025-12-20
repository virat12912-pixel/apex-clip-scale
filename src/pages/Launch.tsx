import { useState } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { 
  DollarSign, 
  Target, 
  Calendar,
  Info,
  ArrowRight,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useCreateCampaign } from "@/hooks/useCampaigns";
import { Database } from "@/integrations/supabase/types";

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

const platforms: { id: PlatformType; label: string; icon: string }[] = [
  { id: "tiktok", label: "TikTok", icon: "📱" },
  { id: "instagram", label: "Instagram", icon: "📸" },
  { id: "youtube", label: "YouTube", icon: "▶️" },
];

const Launch = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    requirements: "",
    niche: "",
    platforms: [] as PlatformType[],
    rate_value: "",
    rate_unit: "100000",
    min_views: "1000",
    max_earnings_per_post: "",
    total_budget: "",
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

    try {
      await createCampaign.mutateAsync({
        name: formData.name,
        description: formData.description,
        requirements: formData.requirements,
        niche: formData.niche,
        platforms: formData.platforms,
        rate_value: parseFloat(formData.rate_value) || 75,
        rate_unit: parseInt(formData.rate_unit) || 100000,
        min_views: parseInt(formData.min_views) || 1000,
        max_earnings_per_post: formData.max_earnings_per_post 
          ? parseFloat(formData.max_earnings_per_post) 
          : undefined,
        total_budget: parseFloat(formData.total_budget) || 1000,
      });

      toast({
        title: "Campaign created!",
        description: "Your campaign is now live and visible to clippers.",
      });
      navigate("/campaigns");
    } catch (error: any) {
      toast({
        title: "Error creating campaign",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout title="Launch Campaign">
      <div className="max-w-3xl mx-auto">
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
            <span>Budget & Goals</span>
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
                        className={`p-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                          formData.platforms.includes(platform.id)
                            ? "bg-primary text-primary-foreground"
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
                  <Label htmlFor="requirements">Requirements</Label>
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
                  className="bg-gradient-primary hover:opacity-90"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Budget & Goals */}
          {step === 2 && (
            <div className="space-y-6 p-6 rounded-2xl bg-card border border-border">
              <div>
                <h2 className="text-xl font-semibold mb-1">Budget & Goals</h2>
                <p className="text-sm text-muted-foreground">
                  Set your budget and performance targets
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
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
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

                  <div className="space-y-2">
                    <Label htmlFor="min_views">Minimum Views</Label>
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
                  className="bg-gradient-primary hover:opacity-90"
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

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-secondary/50">
                  <div className="text-sm text-muted-foreground mb-1">Campaign Name</div>
                  <div className="font-medium">{formData.name || "Not set"}</div>
                </div>

                <div className="p-4 rounded-lg bg-secondary/50">
                  <div className="text-sm text-muted-foreground mb-1">Platforms</div>
                  <div className="font-medium capitalize">{formData.platforms.join(", ") || "Not set"}</div>
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
                    <div className="text-sm text-muted-foreground mb-1">Min Views</div>
                    <div className="font-medium">{parseInt(formData.min_views || "1000").toLocaleString()}</div>
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
                    <div className="font-medium">${formData.rate_value || "75"} / {parseInt(formData.rate_unit || "100000").toLocaleString()} views</div>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50">
                    <div className="text-sm text-muted-foreground mb-1">Max Per Post</div>
                    <div className="font-medium">{formData.max_earnings_per_post ? `$${formData.max_earnings_per_post}` : "No limit"}</div>
                  </div>
                </div>
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
                  className="bg-gradient-primary hover:opacity-90 glow-primary"
                >
                  {createCampaign.isPending ? "Creating..." : "Launch Campaign"}
                  <ArrowRight className="ml-2 h-4 w-4" />
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
