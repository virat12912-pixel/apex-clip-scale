import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/app/AppLayout";
import { useCampaign } from "@/hooks/useCampaigns";
import { useClientUserSubmissions } from "@/hooks/useClientSubmissions";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronRight,
  ExternalLink,
  Eye,
  Heart,
  MessageCircle,
  DollarSign,
  Smartphone,
  Camera,
  Play,
  CheckCircle,
  XCircle,
} from "lucide-react";
import React from "react";

const platformIcons: Record<string, React.ReactNode> = {
  tiktok: <Smartphone className="h-4 w-4" />,
  instagram: <Camera className="h-4 w-4" />,
  youtube: <Play className="h-4 w-4" />,
};

const ClientUserSubmissions = () => {
  const { campaignId, userId } = useParams<{ campaignId: string; userId: string }>();
  const { role } = useAuth();
  const { toast } = useToast();
  const { data: campaign } = useCampaign(campaignId || "");
  const { data: submissions, isLoading: submissionsLoading, refetch } = useClientUserSubmissions(userId || "", campaignId || "");

  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; submissionId: string; hasEarnings: boolean }>({
    open: false,
    submissionId: "",
    hasEarnings: false,
  });
  const [rejectReason, setRejectReason] = useState("");

  const canManage = role === "client_admin" || role === "client_manager";

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
      case "paid":
        return <span className="px-2 py-1 rounded-lg text-xs bg-emerald-500/10 text-emerald-400 backdrop-blur-sm">{status}</span>;
      case "rejected":
        return <span className="px-2 py-1 rounded-lg text-xs bg-red-500/10 text-red-400 backdrop-blur-sm">{status}</span>;
      default:
        return <span className="px-2 py-1 rounded-lg text-xs bg-yellow-500/10 text-yellow-400 backdrop-blur-sm">{status}</span>;
    }
  };

  const handleApprove = async (id: string, views: number) => {
    if (views <= 0) {
      toast({ title: "No views available", description: "Cannot approve a clip with no views", variant: "destructive" });
      return;
    }
    setProcessing(id);
    try {
      const { data, error } = await supabase.functions.invoke("calculate-earnings", {
        body: { submission_id: id, verified_views: views },
      });
      if (error) throw error;
      if (data?.error) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
        return;
      }

      // Send notification to creator
      await supabase.functions.invoke("create-notification", {
        body: {
          user_id: userId,
          type: "submission_approved",
          title: "Clip Approved! 🎉",
          message: `Your clip for "${campaign?.name}" has been approved. Earnings: $${data.earnings}`,
          related_id: id,
        },
      });

      toast({ title: "Submission approved!", description: `Earnings: $${data.earnings}` });
      refetch();
    } catch (error: unknown) {
      toast({ title: "Error", description: "Failed to approve submission", variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  const openRejectDialog = (id: string, hasEarnings: boolean) => {
    setRejectReason("");
    setRejectDialog({ open: true, submissionId: id, hasEarnings });
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast({ title: "Reason required", description: "Please provide a reason for rejection", variant: "destructive" });
      return;
    }
    const { submissionId } = rejectDialog;
    setProcessing(submissionId);
    setRejectDialog({ open: false, submissionId: "", hasEarnings: false });

    try {
      const { data, error } = await supabase.functions.invoke("reject-submission", {
        body: { submission_id: submissionId, reason: rejectReason.trim() },
      });
      if (error) throw error;
      if (data?.error) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
        return;
      }

      // Send notification to creator with the reason
      await supabase.functions.invoke("create-notification", {
        body: {
          user_id: userId,
          type: "submission_rejected",
          title: "Clip Rejected",
          message: `Your clip for "${campaign?.name}" has been rejected. Reason: ${rejectReason.trim()}`,
          related_id: submissionId,
        },
      });

      const reversedAmount = parseFloat(data?.reversed_earnings || "0");
      if (reversedAmount > 0) {
        toast({ title: "Submission rejected", description: `$${reversedAmount.toFixed(2)} earnings reversed` });
      } else {
        toast({ title: "Submission rejected" });
      }
      refetch();
    } catch (error: unknown) {
      toast({ title: "Error", description: "Failed to reject submission", variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  const totalViews = submissions?.reduce((sum, s: any) => sum + Number(s.views || 0), 0) || 0;
  const totalEarnings = submissions?.reduce((sum, s: any) => sum + Number(s.earnings || 0), 0) || 0;

  return (
    <AppLayout title="Creator Submissions">
      <div className="page-enter">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 overflow-x-auto">
          <Link to="/client/submissions" className="hover:text-foreground transition-colors whitespace-nowrap">Campaigns</Link>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          <Link to={`/client/submissions/${campaignId}`} className="hover:text-foreground transition-colors whitespace-nowrap truncate max-w-[120px]">
            {campaign?.name}
          </Link>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          <span className="text-foreground font-display whitespace-nowrap">Creator</span>
        </div>

        {/* Summary Stats */}
        <div className="p-4 sm:p-6 rounded-2xl bg-card/50 border border-border/30 mb-6">
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-display font-bold">{submissions?.length || 0}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Clips</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-display font-bold flex items-center justify-center gap-1">
                <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                {formatNumber(totalViews)}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Views</div>
            </div>
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-display font-bold text-primary flex items-center justify-center gap-1">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
                {totalEarnings.toFixed(2)}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Earnings</div>
            </div>
          </div>
        </div>

        {/* Submissions List */}
        <h3 className="text-lg font-display font-bold mb-4">Clips</h3>

        {submissionsLoading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
        ) : submissions?.length === 0 ? (
          <div className="p-8 rounded-2xl bg-card/50 border border-border/30 text-center text-muted-foreground">
            No submissions for this campaign
          </div>
        ) : (
          <div className="space-y-4 stagger-enter">
            {submissions?.map((sub: any) => {
              const currentViews = Number(sub.views) || Number(sub.submitted_views) || 0;

              return (
                <div key={sub.id} className="p-4 sm:p-5 rounded-2xl bg-card/50 border border-border/30 hover:border-primary/15 transition-all duration-300">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`p-2 rounded-xl flex-shrink-0 ${
                        sub.status === "pending"
                          ? "bg-yellow-500/10 text-yellow-400"
                          : sub.status === "approved" || sub.status === "paid"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-red-500/10 text-red-400"
                      }`}>
                        {platformIcons[sub.platform]}
                      </span>
                      <div className="min-w-0">
                        <a
                          href={sub.clip_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 font-display font-bold text-sm sm:text-base"
                        >
                          <ExternalLink className="h-4 w-4 flex-shrink-0" />
                          View Clip
                        </a>
                        <p className="text-xs text-muted-foreground mt-1 truncate max-w-[200px] sm:max-w-md">
                          {sub.clip_url}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(sub.status)}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 sm:p-4 rounded-xl bg-secondary/20 border border-border/15 mb-3">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-base sm:text-lg font-display font-bold">
                        <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                        {currentViews.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">Views</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-base sm:text-lg font-display font-bold">
                        <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
                        {Number(sub.likes || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">Likes</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-base sm:text-lg font-display font-bold">
                        <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                        {Number(sub.comments || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">Comments</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-base sm:text-lg font-display font-bold text-primary">
                        <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
                        {Number(sub.earnings || 0).toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">Earnings</div>
                    </div>
                  </div>

                  {/* Actions for client_admin / client_manager */}
                  {canManage && (
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      {sub.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            className="bg-emerald-500 hover:bg-emerald-600 rounded-xl"
                            onClick={() => handleApprove(sub.id, currentViews)}
                            disabled={processing === sub.id}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {processing === sub.id ? "Processing..." : "Approve"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="rounded-xl"
                            onClick={() => openRejectDialog(sub.id, false)}
                            disabled={processing === sub.id}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      {sub.status === "approved" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="rounded-xl"
                          onClick={() => openRejectDialog(sub.id, Number(sub.earnings || 0) > 0)}
                          disabled={processing === sub.id}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          {processing === sub.id ? "Reversing..." : "Reject & Reverse"}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Show rejection reason if present */}
                  {sub.status === "rejected" && sub.rejection_reason && (
                    <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/15 text-sm text-red-400 mb-2">
                      <span className="font-medium">Rejection reason:</span> {sub.rejection_reason}
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Submitted {new Date(sub.created_at).toLocaleDateString()} at {new Date(sub.created_at).toLocaleTimeString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Reason Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="font-display">Reject Submission</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this clip. The creator will be notified with this reason.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="e.g. Video quality is too low, wrong content format, doesn't meet brand guidelines..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, submissionId: "", hasEarnings: false })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim()}>
              <XCircle className="h-4 w-4 mr-1" />
              {rejectDialog.hasEarnings ? "Reject & Reverse Earnings" : "Reject Clip"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default ClientUserSubmissions;
