import { useState } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { useAllSubmissions, useUpdateSubmission } from "@/hooks/useSubmissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, CheckCircle, XCircle, Eye, DollarSign, RefreshCw, Smartphone, Camera, Play, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { mapErrorToUserMessage, logError } from "@/lib/errorMapping";

const platformIcons: Record<string, React.ReactNode> = {
  tiktok: <Smartphone className="h-4 w-4" />,
  instagram: <Camera className="h-4 w-4" />,
  youtube: <Play className="h-4 w-4" />,
};

const AdminSubmissions = () => {
  const { data: submissions, isLoading, refetch } = useAllSubmissions();
  const updateSubmission = useUpdateSubmission();
  const { toast } = useToast();
  const [viewInputs, setViewInputs] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);
  const [fetching, setFetching] = useState<string | null>(null);
  const [fetchingAll, setFetchingAll] = useState(false);

  const pendingSubs = submissions?.filter((s) => s.status === "pending") || [];
  const processedSubs = submissions?.filter((s) => s.status !== "pending") || [];

  const handleFetchViews = async (id: string, clipUrl: string, platform: string) => {
    if (platform !== "tiktok") {
      toast({
        title: "Not supported",
        description: "Auto-fetch is only available for TikTok videos",
        variant: "destructive",
      });
      return;
    }

    setFetching(id);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-tiktok-views", {
        body: { video_url: clipUrl },
      });

      if (error) throw error;

      // Function may return a handled error payload (to avoid throwing on 403/429)
      if (data?.success === false) {
        const code = String(data?.error_code || "");

        if (code === "not_subscribed") {
          toast({
            title: "TikTok API not subscribed",
            description: "Auto-fetch is unavailable. Please enter views manually (or renew the API subscription).",
            variant: "destructive",
          });
        } else if (code === "rate_limited") {
          toast({
            title: "Rate limited",
            description: "Too many requests. Please wait a moment or enter views manually.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Could not fetch views",
            description: "Please enter views manually.",
            variant: "destructive",
          });
        }

        return;
      }

      const playCount = Number(data?.play_count ?? 0);

      if (playCount > 0) {
        setViewInputs({ ...viewInputs, [id]: playCount.toString() });
        toast({
          title: "Views fetched",
          description: `Found ${playCount.toLocaleString()} views`,
        });
      } else {
        toast({
          title: "Could not fetch views",
          description: "Please enter views manually",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      logError("AdminSubmissions:handleFetchViews", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      // Check for specific API errors and provide helpful message
      if (errorMsg.includes("403") || errorMsg.includes("not subscribed")) {
        toast({ 
          title: "API subscription expired", 
          description: "Please enter views manually. The TikTok API subscription needs renewal.",
          variant: "destructive" 
        });
      } else if (errorMsg.includes("429") || errorMsg.includes("Too many")) {
        toast({ 
          title: "Rate limited", 
          description: "Too many requests. Please wait a moment or enter views manually.",
          variant: "destructive" 
        });
      } else {
        toast({ 
          title: "API unavailable", 
          description: "Please enter the view count manually.",
          variant: "destructive" 
        });
      }
    } finally {
      setFetching(null);
    }
  };

  const handleFetchAllViews = async () => {
    const tiktokPending = pendingSubs.filter((s) => s.platform === "tiktok");
    
    if (tiktokPending.length === 0) {
      toast({
        title: "No TikTok submissions",
        description: "There are no pending TikTok submissions to fetch views for",
      });
      return;
    }

    setFetchingAll(true);
    let successCount = 0;
    let errorCount = 0;

    for (const sub of tiktokPending) {
      try {
        const { data, error } = await supabase.functions.invoke("fetch-tiktok-views", {
          body: { video_url: sub.clip_url },
        });

        if (error) throw error;

        if (data?.play_count) {
          setViewInputs((prev) => ({ ...prev, [sub.id]: data.play_count.toString() }));
          successCount++;
        } else {
          errorCount++;
        }
      } catch {
        errorCount++;
      }
    }

    setFetchingAll(false);
    toast({
      title: "Bulk fetch complete",
      description: `Fetched ${successCount} of ${tiktokPending.length} videos. ${errorCount} failed.`,
    });
  };

  const handleApprove = async (id: string) => {
    const views = parseInt(viewInputs[id] || "0", 10);
    
    if (views <= 0) {
      toast({
        title: "Enter view count",
        description: "Please enter the verified view count before approving",
        variant: "destructive",
      });
      return;
    }

    setProcessing(id);

    try {
      const { data, error } = await supabase.functions.invoke("calculate-earnings", {
        body: { submission_id: id, verified_views: views },
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Submission approved!",
        description: `Earnings calculated: $${data.earnings}`,
      });
      refetch();
    } catch (error: unknown) {
      logError("AdminSubmissions:handleApprove", error);
      toast({ title: "Error", description: mapErrorToUserMessage(error), variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateSubmission.mutateAsync({ id, status: "rejected" });
      toast({ title: "Submission rejected" });
    } catch (error: unknown) {
      logError("AdminSubmissions:handleReject", error);
      toast({ title: "Error", description: mapErrorToUserMessage(error), variant: "destructive" });
    }
  };

  const tiktokPendingCount = pendingSubs.filter((s) => s.platform === "tiktok").length;

  return (
    <AppLayout title="Manage Submissions">
      {/* Pending Submissions */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Pending Review ({pendingSubs.length})</h2>
          {tiktokPendingCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleFetchAllViews}
              disabled={fetchingAll}
            >
              <Zap className={`h-4 w-4 mr-2 ${fetchingAll ? "animate-pulse" : ""}`} />
              {fetchingAll ? "Fetching..." : `Fetch All TikTok Views (${tiktokPendingCount})`}
            </Button>
          )}
        </div>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : pendingSubs.length === 0 ? (
          <div className="p-8 rounded-xl bg-card border border-border text-center text-muted-foreground">
            No pending submissions
          </div>
        ) : (
          <div className="space-y-4">
            {pendingSubs.map((sub) => (
              <div key={sub.id} className="p-6 rounded-xl bg-card border border-border">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`p-2 rounded-lg bg-secondary`}>
                        {platformIcons[sub.platform] || <Smartphone className="h-4 w-4" />}
                      </span>
                      <div>
                        <h3 className="font-semibold">{sub.creator_profile?.full_name || "Creator"}</h3>
                        <p className="text-sm text-muted-foreground">{sub.campaign?.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{sub.platform}</p>
                      </div>
                    </div>
                  </div>
                  <a
                    href={sub.clip_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm flex items-center gap-1"
                  >
                    View Clip <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Verified Views</span>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Enter view count"
                        value={viewInputs[sub.id] || ""}
                        onChange={(e) => setViewInputs({ ...viewInputs, [sub.id]: e.target.value })}
                        className="bg-secondary"
                      />
                      {sub.platform === "tiktok" && (
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleFetchViews(sub.id, sub.clip_url, sub.platform)}
                          disabled={fetching === sub.id}
                          title="Auto-fetch views"
                        >
                          <RefreshCw className={`h-4 w-4 ${fetching === sub.id ? "animate-spin" : ""}`} />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(sub.id)}
                      disabled={processing === sub.id}
                      className="text-red-400 hover:text-red-300"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(sub.id)}
                      disabled={processing === sub.id}
                      className="bg-emerald-500 hover:bg-emerald-600"
                    >
                      {processing === sub.id ? "Processing..." : (
                        <><CheckCircle className="h-4 w-4 mr-1" />Approve</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Processed Submissions */}
      {processedSubs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Processed ({processedSubs.length})</h2>
          <div className="space-y-3">
            {processedSubs.map((sub) => (
              <div key={sub.id} className="p-4 rounded-xl bg-card border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    sub.status === "approved" || sub.status === "paid"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-red-500/10 text-red-400"
                  }`}>
                    {sub.status === "approved" || sub.status === "paid" ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <XCircle className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{sub.creator_profile?.full_name}</div>
                    <div className="text-sm text-muted-foreground">{sub.campaign?.name}</div>
                  </div>
                  <span className="px-2 py-1 rounded bg-secondary text-xs capitalize flex items-center gap-1">
                    {platformIcons[sub.platform]}
                    {sub.platform}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  {(sub.status === "approved" || sub.status === "paid") && (
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">{sub.views.toLocaleString()} views</div>
                      <div className="font-semibold text-primary flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {Number(sub.earnings).toFixed(2)}
                      </div>
                    </div>
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs capitalize ${
                    sub.status === "approved" || sub.status === "paid"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-red-500/10 text-red-400"
                  }`}>
                    {sub.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default AdminSubmissions;
