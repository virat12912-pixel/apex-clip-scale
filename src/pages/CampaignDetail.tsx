import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AppLayout } from "@/components/app/AppLayout";
import { CampaignLeaderboard } from "@/components/campaigns/CampaignLeaderboard";
import { CampaignExportButton } from "@/components/campaigns/CampaignExportButton";
import { FinalSubmissionForm } from "@/components/campaigns/FinalSubmissionForm";
import { useFinalSubmission } from "@/hooks/useFinalSubmissions";
import { useCampaignAnalytics } from "@/hooks/useCampaignAnalytics";
import { ViewsChart } from "@/components/dashboard/ViewsChart";
import { 
  ArrowLeft,
  DollarSign, 
  Eye, 
  Users,
  CheckCircle,
  AlertCircle,
  Plus,
  X,
  ExternalLink,
  Pause,
  Trash2,
  Smartphone,
  Camera,
  Play,
  Trophy,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCampaign, useUpdateCampaign } from "@/hooks/useCampaigns";
import { useCreateSubmission, useCampaignSubmissions } from "@/hooks/useSubmissions";
import { useDeleteCampaign } from "@/hooks/useCampaignActions";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useMySocialAccounts } from "@/hooks/useSocialAccounts";
import { Database } from "@/integrations/supabase/types";
import { validateClipUrl, SocialPlatform } from "@/lib/urlValidation";

type PlatformType = Database["public"]["Enums"]["platform_type"];

const platformIcons: Record<string, React.ReactNode> = {
  tiktok: <Smartphone className="h-4 w-4" />,
  instagram: <Camera className="h-4 w-4" />,
  youtube: <Play className="h-4 w-4" />,
};

const CampaignDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { role, user } = useAuth();
  const { data: socialAccounts } = useMySocialAccounts();
  const { data: campaign, isLoading, refetch } = useCampaign(id || "");
  const { data: submissions } = useCampaignSubmissions(id || "");
  const { data: finalSubmission, isLoading: isFinalSubmissionLoading } = useFinalSubmission(id || "");
  const { data: analyticsData } = useCampaignAnalytics(id, 30);
  const createSubmission = useCreateSubmission();
  const updateCampaign = useUpdateCampaign();
  const deleteCampaign = useDeleteCampaign();

  const [clipUrls, setClipUrls] = useState<string[]>([""]);
  const [urlErrors, setUrlErrors] = useState<(string | null)[]>([null]);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>("tiktok");
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const isVerificationRequired = selectedPlatform === "tiktok" || selectedPlatform === "instagram";
  const hasVerifiedSocialAccount = !isVerificationRequired
    ? true
    : (socialAccounts?.some((a) => a.platform === selectedPlatform && a.verified) ?? false);

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

    if (isVerificationRequired && !hasVerifiedSocialAccount) {
      toast({
        title: "Verification required",
        description: `Please verify your ${selectedPlatform} account before submitting clips.`,
        variant: "destructive",
      });
      return;
    }
    
    if (validUrls.length === 0) {
      toast({
        title: "No clips to submit",
        description: "Please add at least one clip URL",
        variant: "destructive",
      });
      return;
    }

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
      await createSubmission.mutateAsync({
        submissions: validUrls.map(url => ({
          campaign_id: id!,
          clip_url: url.trim(),
          platform: selectedPlatform,
        })),
        verifiedAccounts: (socialAccounts || []).map(a => ({
          platform: a.platform,
          username: a.username,
          verified: a.verified,
        })),
      });

      toast({
        title: "Clips submitted!",
        description: `${validUrls.length} clip(s) submitted successfully`,
      });

      setClipUrls([""]);
      setAgreeToTerms(false);
      refetch();
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (status: "active" | "paused" | "completed") => {
    try {
      await updateCampaign.mutateAsync({ id: id!, status });
      toast({ title: `Campaign ${status}` });
      refetch();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCampaign.mutateAsync(id!);
      toast({ title: "Campaign deleted" });
      navigate("/campaigns");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
  const budgetUsagePercent = Math.min((Number(campaign.spent_budget) / Number(campaign.total_budget)) * 100, 100);
  const displayBudgetUsagePercent = budgetUsagePercent > 0 && budgetUsagePercent < 1 ? 1 : budgetUsagePercent;
  const isBudgetExhausted = budgetRemaining <= 0;
  const isOwner = user?.id === campaign.created_by;
  const canManage = isOwner || role === "admin";
  const trackedViews = submissions?.reduce((sum, s) => sum + Number(s.views || 0), 0) || 0;
  const isCreatorOrClipper = role === "creator" || role === "clipper";
  const isCompletedCreatorView = isCreatorOrClipper && campaign.status === "completed";
  
  // Detect if campaign was relaunched after a previous paid cycle
  // If there are submissions created after the final_submission was paid, the old FS belongs to a previous cycle
  const isRelaunchedAfterPaid = (() => {
    if (!finalSubmission || finalSubmission.status !== "paid" || !finalSubmission.paid_at) return false;
    const paidAt = new Date(finalSubmission.paid_at).getTime();
    return submissions?.some(s => s.creator_id === user?.id && new Date(s.created_at).getTime() > paidAt) ?? false;
  })();
  
  // If relaunched after paid, treat the old final submission as non-existent for this cycle
  const effectiveFinalSubmission = isRelaunchedAfterPaid ? null : finalSubmission;
  const isFinalSubmissionApproved = effectiveFinalSubmission?.status === "approved" || effectiveFinalSubmission?.status === "paid";
  const hasFinalSubmission = !!effectiveFinalSubmission;
  // Check if this creator has any submissions in this campaign
  const hasSubmittedClips = submissions?.some((s) => s.creator_id === user?.id) ?? false;
  // Show form only if campaign completed AND no final submission exists yet AND creator has submitted clips
  const shouldShowFinalSubmissionOnly = isCompletedCreatorView && !hasFinalSubmission && hasSubmittedClips;
  // Show locked submission view if submitted but not yet approved (or rejected)
  const shouldShowLockedView = isCompletedCreatorView && hasFinalSubmission && !isFinalSubmissionApproved;

  if (isCompletedCreatorView && isFinalSubmissionLoading) {
    return (
      <AppLayout title={campaign.name}>
        <Skeleton className="h-80" />
      </AppLayout>
    );
  }

  if (shouldShowFinalSubmissionOnly) {
    return (
      <AppLayout title={campaign.name}>
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/campaigns")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Button>
        </div>

        <div className="max-w-3xl">
          <FinalSubmissionForm
            campaignId={id || ""}
            campaignStatus={campaign.status}
            trackedViews={trackedViews}
          />
        </div>
      </AppLayout>
    );
  }

  // Show locked view (submitted/under_review/rejected) with status banner
  if (shouldShowLockedView) {
    return (
      <AppLayout title={campaign.name}>
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/campaigns")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Button>
        </div>

        <div className="max-w-3xl">
          <FinalSubmissionForm
            campaignId={id || ""}
            campaignStatus={campaign.status}
            trackedViews={trackedViews}
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={campaign.name}>
      {/* Back button */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/campaigns")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Campaigns
        </Button>

        {/* Campaign Management for owners/admins */}
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <CampaignExportButton 
              campaignId={campaign.id} 
              campaignName={campaign.name}
              size="sm"
            />
            {campaign.status === "active" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange("paused")}
              >
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </Button>
            )}
            {campaign.status === "paused" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange("active")}
              >
                <Play className="h-4 w-4 mr-1" />
                Resume
              </Button>
            )}
            {campaign.status === "completed" && role === "admin" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange("active")}
              >
                <Play className="h-4 w-4 mr-1" />
                Reactivate
              </Button>
            )}
            {(campaign.status === "active" || campaign.status === "paused") && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange("completed")}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                End Campaign
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Campaign?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. All submissions will also be deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="p-6 rounded-2xl bg-card/50 border border-border/30 hover:border-primary/15 hover:shadow-lg transition-all duration-300">
            {/* Campaign Image */}
            {campaign.image_url && (
              <div className="w-full h-48 rounded-lg overflow-hidden mb-4">
                <img src={campaign.image_url} alt={campaign.name} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-display font-bold">{campaign.name}</h1>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400"
                    : campaign.status === "paused"
                    ? "bg-amber-500/10 text-amber-400"
                    : "bg-secondary text-muted-foreground"
                }`}>
                  {campaign.status}
                </span>
              </div>
            </div>

            {/* Platforms */}
            {campaign.platforms && campaign.platforms.length > 0 && (
              <div className="flex gap-2 mb-4">
                {campaign.platforms.map((platform) => (
                  <span 
                    key={platform}
                    className="px-3 py-1.5 rounded-lg bg-secondary text-sm capitalize flex items-center gap-2"
                  >
                    {platformIcons[platform]} {platform}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="mb-6">
              <h3 className="font-display font-bold mb-2">Description</h3>
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

          {/* Tabs for Submit / Leaderboard / Analytics */}
          <Tabs defaultValue={isActive ? "submit" : "leaderboard"} className="w-full">
            <TabsList className={`w-full grid ${isActive && !canManage ? 'grid-cols-2' : isActive && canManage ? 'grid-cols-3' : canManage ? 'grid-cols-2' : 'grid-cols-1'} mb-4`}>
              {isActive && (
                <TabsTrigger value="submit" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Submit Clips
                </TabsTrigger>
              )}
              <TabsTrigger value="leaderboard" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Leaderboard
              </TabsTrigger>
              {canManage && (
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="submit" className="space-y-6">
              {/* Submit clips (for creators) */}
              {isCreatorOrClipper && isActive && !isBudgetExhausted && (
            <div className="p-6 rounded-2xl bg-card/50 border border-border/30">
                  <h3 className="text-lg font-display font-bold mb-4">Submit Your Clips</h3>

                  <div className="space-y-4">
                    {/* Platform selector */}
                    <div className="space-y-2">
                      <Label>Platform</Label>
                      <div className="flex gap-2">
                        {campaign.platforms?.map((platform) => (
                          <button
                            key={platform}
                            onClick={() => setSelectedPlatform(platform)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                              selectedPlatform === platform
                                ? "bg-primary text-primary-foreground glow-primary-sm"
                                : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                            }`}
                          >
                            {platformIcons[platform]} {platform}
                          </button>
                        ))}
                      </div>
                    </div>

                    {isVerificationRequired && !hasVerifiedSocialAccount && (
                      <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-destructive">Verification Required</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              You must verify your {selectedPlatform} account before submitting clips to this campaign.
                            </p>
                            <Button asChild size="sm" variant="outline" className="mt-3 btn-glow">
                              <Link to="/social-accounts">Verify {selectedPlatform} Account</Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

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
                      <Button variant="outline" size="sm" onClick={addClipUrl} className="btn-glow">
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
                      disabled={createSubmission.isPending || !agreeToTerms || (isVerificationRequired && !hasVerifiedSocialAccount)}
                      className="w-full bg-gradient-primary hover:opacity-90 btn-glow"
                    >
                      {isVerificationRequired && !hasVerifiedSocialAccount 
                        ? "Verification Required" 
                        : createSubmission.isPending 
                        ? "Submitting..." 
                        : "Submit Clips"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Budget Exhausted Notice */}
              {isCreatorOrClipper && isBudgetExhausted && (
                <div className="p-6 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-6 w-6 text-yellow-500" />
                    <div>
                      <h3 className="font-semibold text-yellow-500">Budget Exhausted</h3>
                      <p className="text-sm text-muted-foreground">
                        This campaign has reached its budget limit and is no longer accepting submissions.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Campaign Paused Notice */}
              {isCreatorOrClipper && campaign.status === "paused" && (
                <div className="p-6 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex items-center gap-3">
                    <Pause className="h-6 w-6 text-yellow-500" />
                    <div>
                      <h3 className="font-semibold text-yellow-500">Campaign Paused</h3>
                      <p className="text-sm text-muted-foreground">
                        This campaign is currently paused and not accepting new submissions.
                      </p>
                    </div>
                  </div>
                </div>
              )}


              {/* Submissions list (for brand/admin) */}
              {(role === "brand" || role === "admin") && submissions && submissions.length > 0 && (
              <div className="p-6 rounded-2xl bg-card/50 border border-border/30">
                  <h3 className="text-lg font-display font-bold mb-4">
                    Submissions ({submissions.length})
                  </h3>
                  <div className="space-y-3 stagger-enter">
                    {submissions.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover-scale">
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
                          <span className="px-2 py-1 rounded bg-secondary text-xs capitalize flex items-center gap-1">
                            {platformIcons[sub.platform]}
                            {sub.platform}
                          </span>
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
            </TabsContent>

            <TabsContent value="leaderboard">
              <CampaignLeaderboard campaignId={id || ""} />
            </TabsContent>

            {canManage && (
              <TabsContent value="analytics" className="space-y-6">
                {analyticsData && analyticsData.length > 0 ? (
                  <ViewsChart 
                    data={analyticsData} 
                    title="Campaign Performance (Last 30 Days)"
                    showEarnings={true}
                  />
                ) : (
                  <div className="p-6 rounded-xl bg-card border border-border text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No analytics data available yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Analytics will appear once submissions start coming in
                    </p>
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="p-6 rounded-2xl bg-card/50 border border-border/30">
            <h3 className="font-display font-bold mb-4">Campaign Stats</h3>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">RPM</div>
                  <div className="font-semibold">
                    ${campaign.rate_value} / 1K views
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
          <div className="p-6 rounded-2xl bg-card/50 border border-border/30">
            <h3 className="font-display font-bold mb-4">Budget</h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Used</span>
                  <span className="font-medium">
                    ${Number(campaign.spent_budget).toFixed(2)} / ${Number(campaign.total_budget).toFixed(2)}
                  </span>
                </div>
                <div className="h-3 bg-background rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      isBudgetExhausted ? "bg-red-500" : "bg-gradient-primary"
                    }`}
                    style={{ width: `${displayBudgetUsagePercent}%` }}
                  />
                </div>
              </div>

              <div className={`p-4 rounded-lg border ${
                isBudgetExhausted 
                  ? "bg-red-500/10 border-red-500/20" 
                  : "bg-primary/10 border-primary/20"
              }`}>
                <div className="text-sm text-muted-foreground">Remaining</div>
                <div className={`text-2xl font-bold ${isBudgetExhausted ? "text-red-500" : "text-primary"}`}>
                  ${budgetRemaining.toFixed(2)}
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
