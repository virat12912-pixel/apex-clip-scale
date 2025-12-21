import { useState, useMemo } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { useAllSubmissions, useUpdateSubmission } from "@/hooks/useSubmissions";
import { useCampaigns } from "@/hooks/useCampaigns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  Eye, 
  DollarSign, 
  RefreshCw, 
  Smartphone, 
  Camera, 
  Play, 
  Zap,
  Trophy,
  ChevronDown,
  ChevronRight,
  Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { mapErrorToUserMessage, logError } from "@/lib/errorMapping";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const platformIcons: Record<string, React.ReactNode> = {
  tiktok: <Smartphone className="h-4 w-4" />,
  instagram: <Camera className="h-4 w-4" />,
  youtube: <Play className="h-4 w-4" />,
};

const AdminSubmissions = () => {
  const { data: submissions, isLoading, refetch } = useAllSubmissions();
  const { data: campaigns } = useCampaigns();
  const updateSubmission = useUpdateSubmission();
  const { toast } = useToast();
  const [viewInputs, setViewInputs] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);
  const [fetching, setFetching] = useState<string | null>(null);
  const [fetchingAll, setFetchingAll] = useState(false);
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>("pending");

  // Group submissions by campaign
  const groupedSubmissions = useMemo(() => {
    if (!submissions) return new Map();
    
    const grouped = new Map<string, typeof submissions>();
    
    submissions.forEach(sub => {
      const campaignId = sub.campaign_id;
      const campaignName = sub.campaign?.name || "Unknown Campaign";
      const key = `${campaignId}|${campaignName}`;
      
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(sub);
    });
    
    return grouped;
  }, [submissions]);

  // Get leaderboard for a campaign (top earners)
  const getLeaderboard = (campaignSubs: typeof submissions) => {
    if (!campaignSubs) return [];
    
    const creatorEarnings = new Map<string, { 
      name: string; 
      totalViews: number; 
      totalEarnings: number; 
      submissionCount: number 
    }>();
    
    campaignSubs.forEach(sub => {
      if (sub.status === "approved" || sub.status === "paid") {
        const creatorId = sub.creator_id;
        const creatorName = sub.creator_profile?.full_name || "Unknown";
        
        if (!creatorEarnings.has(creatorId)) {
          creatorEarnings.set(creatorId, { 
            name: creatorName, 
            totalViews: 0, 
            totalEarnings: 0,
            submissionCount: 0 
          });
        }
        
        const current = creatorEarnings.get(creatorId)!;
        current.totalViews += Number(sub.views);
        current.totalEarnings += Number(sub.earnings);
        current.submissionCount += 1;
      }
    });
    
    return Array.from(creatorEarnings.values())
      .sort((a, b) => b.totalEarnings - a.totalEarnings)
      .slice(0, 5);
  };

  const toggleCampaign = (key: string) => {
    const newExpanded = new Set(expandedCampaigns);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedCampaigns(newExpanded);
  };

  const handleFetchViews = async (id: string, clipUrl: string, platform: string) => {
    if (platform !== "tiktok" && platform !== "instagram") {
      toast({
        title: "Not supported",
        description: "Auto-fetch is only available for TikTok and Instagram videos",
        variant: "destructive",
      });
      return;
    }

    setFetching(id);
    const functionName = platform === "instagram" ? "fetch-instagram-views" : "fetch-tiktok-views";
    const platformLabel = platform === "instagram" ? "Instagram" : "TikTok";
    
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { video_url: clipUrl },
      });

      if (error) throw error;

      if (data?.success === false) {
        const code = String(data?.error_code || "");

        if (code === "not_subscribed") {
          toast({
            title: `${platformLabel} API not subscribed`,
            description: "Auto-fetch is unavailable. Please enter views manually.",
            variant: "destructive",
          });
        } else if (code === "rate_limited") {
          toast({
            title: "Rate limited",
            description: "Too many requests. Please wait or enter views manually.",
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
      toast({ 
        title: "API unavailable", 
        description: "Please enter the view count manually.",
        variant: "destructive" 
      });
    } finally {
      setFetching(null);
    }
  };

  const handleFetchAllViews = async () => {
    const allPending = submissions?.filter((s) => 
      s.status === "pending" && (s.platform === "tiktok" || s.platform === "instagram")
    ) || [];
    
    if (allPending.length === 0) {
      toast({
        title: "No fetchable submissions",
        description: "No pending TikTok/Instagram submissions found",
      });
      return;
    }

    setFetchingAll(true);
    let successCount = 0;
    let errorCount = 0;

    for (const sub of allPending) {
      try {
        const functionName = sub.platform === "instagram" ? "fetch-instagram-views" : "fetch-tiktok-views";
        const { data, error } = await supabase.functions.invoke(functionName, {
          body: { video_url: sub.clip_url },
        });

        if (!error && data?.success !== false && data?.play_count) {
          setViewInputs((prev) => ({ ...prev, [sub.id]: data.play_count.toString() }));
          successCount++;
        } else {
          errorCount++;
        }
      } catch {
        errorCount++;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setFetchingAll(false);
    toast({
      title: "Bulk fetch complete",
      description: `Fetched ${successCount} of ${allPending.length} videos.`,
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

  const totalPending = submissions?.filter(s => s.status === "pending").length || 0;
  const fetchablePendingCount = submissions?.filter((s) => 
    s.status === "pending" && (s.platform === "tiktok" || s.platform === "instagram")
  ).length || 0;

  return (
    <AppLayout title="Manage Submissions">
      <div className="page-enter">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40 bg-secondary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending ({totalPending})</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {fetchablePendingCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleFetchAllViews}
              disabled={fetchingAll}
              className="btn-glow"
            >
              <Zap className={`h-4 w-4 mr-2 ${fetchingAll ? "animate-pulse" : ""}`} />
              {fetchingAll ? "Fetching..." : `Fetch All Views (${fetchablePendingCount})`}
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : groupedSubmissions.size === 0 ? (
          <div className="p-12 rounded-xl bg-card border border-border text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No submissions yet</h3>
            <p className="text-muted-foreground">Submissions will appear here when creators submit clips</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Array.from(groupedSubmissions.entries()).map(([key, campaignSubs]) => {
              const [campaignId, campaignName] = key.split("|");
              const isExpanded = expandedCampaigns.has(key);
              
              const filteredSubs = filterStatus === "all" 
                ? campaignSubs 
                : campaignSubs.filter(s => s.status === filterStatus);
              
              if (filteredSubs.length === 0) return null;
              
              const pendingCount = campaignSubs.filter(s => s.status === "pending").length;
              const approvedCount = campaignSubs.filter(s => s.status === "approved" || s.status === "paid").length;
              const leaderboard = getLeaderboard(campaignSubs);
              
              return (
                <Collapsible key={key} open={isExpanded} onOpenChange={() => toggleCampaign(key)}>
                  <div className="rounded-xl bg-card border border-border overflow-hidden card-hover">
                    <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors">
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div className="text-left">
                          <h3 className="font-semibold">{campaignName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {campaignSubs.length} submissions
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {pendingCount > 0 && (
                          <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/10 text-yellow-400">
                            {pendingCount} pending
                          </span>
                        )}
                        {approvedCount > 0 && (
                          <span className="px-2 py-1 rounded-full text-xs bg-emerald-500/10 text-emerald-400">
                            {approvedCount} approved
                          </span>
                        )}
                      </div>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <div className="border-t border-border">
                        {/* Leaderboard */}
                        {leaderboard.length > 0 && (
                          <div className="p-4 bg-secondary/30 border-b border-border">
                            <div className="flex items-center gap-2 mb-3">
                              <Trophy className="h-4 w-4 text-yellow-400" />
                              <span className="text-sm font-medium">Top Performers</span>
                            </div>
                            <div className="grid grid-cols-5 gap-2">
                              {leaderboard.map((creator, idx) => (
                                <div 
                                  key={idx}
                                  className="p-3 rounded-lg bg-card border border-border text-center"
                                >
                                  <div className="text-xs text-muted-foreground mb-1">
                                    #{idx + 1}
                                  </div>
                                  <div className="font-medium text-sm truncate">
                                    {creator.name}
                                  </div>
                                  <div className="text-primary font-bold">
                                    ${creator.totalEarnings.toFixed(0)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {(creator.totalViews / 1000).toFixed(1)}K views
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Submissions */}
                        <div className="divide-y divide-border">
                          {filteredSubs.map((sub) => (
                            <div key={sub.id} className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className={`p-2 rounded-lg ${
                                    sub.status === "pending" 
                                      ? "bg-yellow-500/10 text-yellow-400"
                                      : sub.status === "approved" || sub.status === "paid"
                                      ? "bg-emerald-500/10 text-emerald-400"
                                      : "bg-red-500/10 text-red-400"
                                  }`}>
                                    {platformIcons[sub.platform]}
                                  </span>
                                  <div>
                                    <div className="font-medium">
                                      {sub.creator_profile?.full_name || "Creator"}
                                    </div>
                                    <a 
                                      href={sub.clip_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-primary hover:underline flex items-center gap-1"
                                    >
                                      View Clip <ExternalLink className="h-3 w-3" />
                                    </a>
                                  </div>
                                </div>
                                
                                {sub.status === "pending" ? (
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                      <Input
                                        type="number"
                                        placeholder="Views"
                                        value={viewInputs[sub.id] || ""}
                                        onChange={(e) => setViewInputs({ ...viewInputs, [sub.id]: e.target.value })}
                                        className="w-28 bg-secondary"
                                      />
                                      {(sub.platform === "tiktok" || sub.platform === "instagram") && (
                                        <Button
                                          size="icon"
                                          variant="outline"
                                          onClick={() => handleFetchViews(sub.id, sub.clip_url, sub.platform)}
                                          disabled={fetching === sub.id}
                                        >
                                          <RefreshCw className={`h-4 w-4 ${fetching === sub.id ? "animate-spin" : ""}`} />
                                        </Button>
                                      )}
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleReject(sub.id)}
                                        disabled={processing === sub.id}
                                        className="text-red-400"
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() => handleApprove(sub.id)}
                                        disabled={processing === sub.id}
                                        className="bg-emerald-500 hover:bg-emerald-600"
                                      >
                                        {processing === sub.id ? "..." : <CheckCircle className="h-4 w-4" />}
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-4">
                                    {(sub.status === "approved" || sub.status === "paid") && (
                                      <div className="text-right">
                                        <div className="text-sm text-muted-foreground">
                                          {Number(sub.views).toLocaleString()} views
                                        </div>
                                        <div className="font-semibold text-primary">
                                          ${Number(sub.earnings).toFixed(2)}
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
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AdminSubmissions;
