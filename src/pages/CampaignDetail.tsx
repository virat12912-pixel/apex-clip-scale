import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AppLayout } from "@/components/app/AppLayout";
import { 
  ArrowLeft,
  DollarSign, 
  Eye, 
  Users,
  CheckCircle,
  AlertCircle,
  Plus,
  X,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useCampaign } from "@/hooks/useCampaigns";
import { useCreateSubmission, useCampaignSubmissions } from "@/hooks/useSubmissions";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Database } from "@/integrations/supabase/types";
import { validateClipUrl, SocialPlatform } from "@/lib/urlValidation";

type PlatformType = Database["public"]["Enums"]["platform_type"];

const platformIcons: Record<string, string> = {
  tiktok: "📱",
  instagram: "📸",
  youtube: "▶️",
};

const CampaignDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role } = useAuth();
  const { data: campaign, isLoading } = useCampaign(id || "");
  const { data: submissions } = useCampaignSubmissions(id || "");
  const createSubmission = useCreateSubmission();

  const [clipUrls, setClipUrls] = useState<string[]>([""]);
  const [urlErrors, setUrlErrors] = useState<(string | null)[]>([null]);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>("tiktok");
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const addClipUrl = () => {
    setClipUrls([...clipUrls, ""]);
    setUrlErrors([...urlErrors, null]);
  };

  const removeClipUrl = (index: number) => {
    setClipUrls(clipUrls.filter((_, i) => i !== index));
    setUrlErrors(urlErrors.filter((_, i) => i !== index));
  };

  const updateClipUrl = (index: number, value: string) => {
    const newUrls = [...clipUrls];
    newUrls[index] = value;
    setClipUrls(newUrls);
    
    // Validate URL on change
    const newErrors = [...urlErrors];
    if (value.trim()) {
      newErrors[index] = validateClipUrl(value, selectedPlatform as SocialPlatform);
    } else {
      newErrors[index] = null;
    }
    setUrlErrors(newErrors);
  };

  const handleSubmit = async () => {
    const validUrls = clipUrls.filter(url => url.trim() !== "");
    
    if (validUrls.length === 0) {
      toast({
        title: "No clips to submit",
        description: "Please add at least one clip URL",
        variant: "destructive",
      });
      return;
    }

    // Validate all URLs before submission
    const validationErrors = validUrls.map(url => validateClipUrl(url, selectedPlatform as SocialPlatform));
    const hasErrors = validationErrors.some(error => error !== null);
    
    if (hasErrors) {
      toast({
        title: "Invalid URLs",
        description: "Please fix the invalid URLs before submitting",
        variant: "destructive",
      });
      return;
    }

    if (!agreeToTerms) {
      toast({
        title: "Agreement required",
        description: "Please agree to the campaign requirements",
        variant: "destructive",
      });
      return;
    }

    try {
      await createSubmission.mutateAsync(
        validUrls.map(url => ({
          campaign_id: id!,
          clip_url: url.trim(),
          platform: selectedPlatform,
        }))
      );

      toast({
        title: "Clips submitted!",
        description: `${validUrls.length} clip(s) submitted successfully`,
      });

      setClipUrls([""]);
      setAgreeToTerms(false);
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Campaign Details">
        <Skeleton className="h-96" />
      </AppLayout>
    );
  }

  if (!campaign) {
    return (
      <AppLayout title="Campaign Not Found">
        <div className="text-center py-16">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Campaign not found</h3>
          <Button asChild>
            <Link to="/campaigns">Browse Campaigns</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  const isActive = campaign.status === "active";
  const budgetRemaining = Number(campaign.total_budget) - Number(campaign.spent_budget);

  return (
    <AppLayout title={campaign.name}>
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/campaigns")}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Campaigns
      </Button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
                  {campaign.creator_profile?.full_name?.charAt(0) || "C"}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{campaign.name}</h1>
                  <p className="text-muted-foreground">
                    by {campaign.creator_profile?.full_name || "Creator"}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-secondary text-muted-foreground"
              }`}>
                {campaign.status}
              </span>
            </div>

            {/* Platforms */}
            {campaign.platforms && campaign.platforms.length > 0 && (
              <div className="flex gap-2 mb-4">
                {campaign.platforms.map((platform) => (
                  <span 
                    key={platform}
                    className="px-3 py-1.5 rounded-lg bg-secondary text-sm capitalize"
                  >
                    {platformIcons[platform]} {platform}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">
                {campaign.description || "No description provided"}
              </p>
            </div>

            {/* Requirements */}
            {campaign.requirements && (
              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <h3 className="font-semibold mb-2">Requirements</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {campaign.requirements}
                </p>
              </div>
            )}
          </div>

          {/* Submit clips (for creators) */}
          {role === "creator" && isActive && (
            <div className="p-6 rounded-xl bg-card border border-border">
              <h3 className="text-lg font-semibold mb-4">Submit Your Clips</h3>

              <div className="space-y-4">
                {/* Platform selector */}
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <div className="flex gap-2">
                    {campaign.platforms?.map((platform) => (
                      <button
                        key={platform}
                        onClick={() => setSelectedPlatform(platform)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedPlatform === platform
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {platformIcons[platform]} {platform}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clip URLs */}
                <div className="space-y-2">
                  <Label>Clip URLs</Label>
                  {clipUrls.map((url, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex gap-2">
                        <Input
                          placeholder={`https://${selectedPlatform}.com/...`}
                          value={url}
                          onChange={(e) => updateClipUrl(index, e.target.value)}
                          className={`bg-secondary ${urlErrors[index] ? 'border-red-500' : 'border-border'}`}
                        />
                        {clipUrls.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeClipUrl(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {urlErrors[index] && (
                        <p className="text-xs text-red-500 pl-1">{urlErrors[index]}</p>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addClipUrl}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another
                  </Button>
                </div>

                {/* Agreement */}
                <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/50">
                  <Checkbox
                    id="agree"
                    checked={agreeToTerms}
                    onCheckedChange={(checked) => setAgreeToTerms(checked === true)}
                  />
                  <label htmlFor="agree" className="text-sm text-muted-foreground cursor-pointer">
                    I confirm that my clips meet all campaign requirements and I agree to the terms
                  </label>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={createSubmission.isPending}
                  className="w-full bg-gradient-primary hover:opacity-90"
                >
                  {createSubmission.isPending ? "Submitting..." : "Submit Clips"}
                </Button>
              </div>
            </div>
          )}

          {/* Submissions list (for brand/admin) */}
          {(role === "brand" || role === "admin") && submissions && submissions.length > 0 && (
            <div className="p-6 rounded-xl bg-card border border-border">
              <h3 className="text-lg font-semibold mb-4">
                Submissions ({submissions.length})
              </h3>
              <div className="space-y-3">
                {submissions.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <span className={`p-2 rounded-lg ${
                        sub.status === "approved" || sub.status === "paid"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : sub.status === "rejected"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-primary/10 text-primary"
                      }`}>
                        {sub.status === "approved" || sub.status === "paid" ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{sub.creator_profile?.full_name || "Creator"}</p>
                        <p className="text-xs text-muted-foreground">{formatNumber(sub.views)} views</p>
                      </div>
                    </div>
                    <a 
                      href={sub.clip_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm flex items-center gap-1"
                    >
                      View <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="p-6 rounded-xl bg-card border border-border">
            <h3 className="font-semibold mb-4">Campaign Stats</h3>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Rate</div>
                  <div className="font-semibold">
                    ${campaign.rate_value} / {formatNumber(campaign.rate_unit)} views
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Min Views</div>
                  <div className="font-semibold">{formatNumber(campaign.min_views)}</div>
                </div>
              </div>

              {campaign.max_earnings_per_post && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Max Per Post</div>
                    <div className="font-semibold">${campaign.max_earnings_per_post}</div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Submissions</div>
                  <div className="font-semibold">{submissions?.length || 0}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Budget */}
          <div className="p-6 rounded-xl bg-card border border-border">
            <h3 className="font-semibold mb-4">Budget</h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Used</span>
                  <span className="font-medium">
                    ${Number(campaign.spent_budget).toFixed(0)} / ${Number(campaign.total_budget).toFixed(0)}
                  </span>
                </div>
                <div className="h-3 bg-background rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-primary rounded-full transition-all"
                    style={{ width: `${Math.min((Number(campaign.spent_budget) / Number(campaign.total_budget)) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="text-sm text-muted-foreground">Remaining</div>
                <div className="text-2xl font-bold text-primary">
                  ${budgetRemaining.toFixed(0)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CampaignDetail;
