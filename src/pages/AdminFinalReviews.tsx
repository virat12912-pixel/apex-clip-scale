import { useState, useEffect } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { useAllFinalSubmissions, getFinalSubmissionFilePath, FinalSubmission } from "@/hooks/useFinalSubmissions";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FinalSubmissionTimeline } from "@/components/campaigns/FinalSubmissionTimeline";
import { useToast } from "@/hooks/use-toast";
import { Eye, ExternalLink, CheckCircle, XCircle, Users, BarChart3, Globe, ChevronDown, ChevronUp, Image, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";

const isVideoUrl = (url: string) => /\.(mp4|mov|webm|m4v|avi|mkv|quicktime)(\?|$)/i.test(url);

function ScreenshotGallery({ urls, labels }: { urls: (string | null)[]; labels: string[] }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {urls.map((url, i) => url ? (
        isVideoUrl(url) ? (
          <div key={i} className="rounded-lg overflow-hidden border border-border/30 aspect-video bg-black">
            <video src={url} controls className="w-full h-full object-contain" />
          </div>
        ) : (
        <Dialog key={i}>
          <DialogTrigger asChild>
            <button className="relative group rounded-lg overflow-hidden border border-border/30 aspect-video">
              <img src={url} alt={labels[i]} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Eye className="h-5 w-5 text-white" />
              </div>
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl p-2 bg-card">
            <DialogTitle className="sr-only">{labels[i]}</DialogTitle>
            <img src={url} alt={labels[i]} className="w-full rounded-lg" />
            <p className="text-xs text-muted-foreground text-center mt-1">{labels[i]}</p>
          </DialogContent>
        </Dialog>
        )
      ) : (
        <div key={i} className="rounded-lg border border-dashed border-border/30 aspect-video flex items-center justify-center">
          <Image className="h-5 w-5 text-muted-foreground/30" />
        </div>
      ))}
    </div>
  );
}

function ReviewCard({ submission }: { submission: FinalSubmission }) {
  const [expanded, setExpanded] = useState(false);
  const [verifiedViews, setVerifiedViews] = useState(submission.verified_views?.toString() || "");
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  // Single in-flight flag for the WHOLE review flow (Edge Function call +
  // notification + invalidation). Both buttons disable on it, so a
  // double-click cannot re-run the review (C-04).
  const [reviewing, setReviewing] = useState(false);

  // Route the review through the review-final-submission Edge Function
  // (accounting_review_final RPC): one server-side transaction that sets
  // status/verified_views/final_earnings, adjusts the wallet and
  // spent_budget with caps, and writes the review record. No browser-side
  // wallet math or sequential writes (C-04).
  const runReview = async (decision: "approve" | "reject", verifiedViewsValue?: number) => {
    setReviewing(true);
    try {
      const { data, error } = await supabase.functions.invoke("review-final-submission", {
        body: {
          final_submission_id: submission.id,
          decision,
          verified_views: verifiedViewsValue,
          admin_notes: notes || undefined,
        },
      });
      if (error) throw new Error((data as { error?: string } | null)?.error || error.message);
      if ((data as { error?: string } | null)?.error) throw new Error((data as { error: string }).error);
      return data as { earnings?: number } | null;
    } finally {
      setReviewing(false);
    }
  };

  const invalidateReviewQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["wallet"] });
    queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    queryClient.invalidateQueries({ queryKey: ["campaign"] });
    queryClient.invalidateQueries({ queryKey: ["submissions"] });
    queryClient.invalidateQueries({ queryKey: ["final-submissions"] });
  };

  const handleApprove = async () => {
    if (!verifiedViews || Number(verifiedViews) <= 0) {
      toast({ title: "Set verified views first", variant: "destructive" });
      return;
    }
    try {
      const result = await runReview("approve", Number(verifiedViews));
      const earnings = Number(result?.earnings ?? estimatedEarnings);

      // Send notification to clipper
      await supabase.functions.invoke("create-notification", {
        body: {
          user_id: submission.user_id,
          type: "final_submission_approved",
          title: "Final Submission Approved!",
          message: `Your final submission for "${submission.campaign?.name}" has been approved. You earned $${earnings.toFixed(2)} and are eligible for payouts.`,
          related_id: submission.id,
        },
      });
      invalidateReviewQueries();
      toast({ title: "Submission approved" });
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Review failed", variant: "destructive" });
    }
  };

  const handleReject = async () => {
    // A rejection must carry a reason — the admin's notes are the reason
    // shown to the creator.
    if (!notes.trim()) {
      toast({ title: "Rejection reason required", description: "Enter the reason for rejection in the notes field.", variant: "destructive" });
      return;
    }
    try {
      await runReview("reject");
      // Send notification to clipper
      await supabase.functions.invoke("create-notification", {
        body: {
          user_id: submission.user_id,
          type: "final_submission_rejected",
          title: "Final Submission Rejected",
          message: `Your final submission for "${submission.campaign?.name}" has been rejected.${notes ? ` Reason: ${notes}` : ""}`,
          related_id: submission.id,
        },
      });
      invalidateReviewQueries();
      toast({ title: "Submission rejected" });
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Review failed", variant: "destructive" });
    }
  };
  const [recordingUrls, setRecordingUrls] = useState<(string | null)[]>([null, null, null]);
  const [accountRecordingUrl, setAccountRecordingUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const signedUrl = async (publicUrl: string | null) => {
      const path = getFinalSubmissionFilePath(publicUrl);
      if (!path) return null;
      const { data, error } = await supabase.storage.from("final-submissions").createSignedUrl(path, 300);
      return error ? null : data.signedUrl;
    };
    Promise.all([submission.video_screenshot_1, submission.video_screenshot_2, submission.video_screenshot_3].map(signedUrl))
      .then((urls) => { if (!cancelled) setRecordingUrls(urls); });
    signedUrl(submission.account_analytics_screenshot).then((url) => { if (!cancelled) setAccountRecordingUrl(url); });
    return () => { cancelled = true; };
  }, [submission.video_screenshot_1, submission.video_screenshot_2, submission.video_screenshot_3, submission.account_analytics_screenshot]);

  const rate = submission.campaign?.rate_value || 0;
  const rateUnit = submission.campaign?.rate_unit || 1000;
  const estimatedEarnings = verifiedViews ? (Number(verifiedViews) / rateUnit) * rate : 0;

  const statusColors: Record<string, string> = {
    submitted: "bg-yellow-500/10 text-yellow-400",
    under_review: "bg-blue-500/10 text-blue-400",
    approved: "bg-emerald-500/10 text-emerald-400",
    rejected: "bg-red-500/10 text-red-400",
    paid: "bg-primary/10 text-primary",
  };

  return (
    <div className="rounded-2xl bg-card/50 border border-border/30 overflow-hidden">
      {/* Header */}
      <button onClick={() => setExpanded(!expanded)} className="w-full p-5 flex items-center justify-between hover:bg-secondary/10 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
            {submission.creator_profile?.full_name?.charAt(0) || "?"}
          </div>
          <div className="text-left">
            <div className="font-display font-bold">{submission.creator_profile?.full_name || "Unknown"}</div>
            <div className="text-xs text-muted-foreground/50">{submission.campaign?.name} • {new Date(submission.submitted_at).toLocaleDateString()}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${statusColors[submission.status]}`}>
            {submission.status.replace("_", " ")}
          </span>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-5 border-t border-border/20 pt-5">
          <FinalSubmissionTimeline status={submission.status} />

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-secondary/20 border border-border/20">
              <div className="text-xs text-muted-foreground/50">Tracked Views</div>
              <div className="font-bold">{submission.tracked_views.toLocaleString()}</div>
            </div>
            <div className="p-3 rounded-xl bg-secondary/20 border border-border/20">
              <div className="text-xs text-muted-foreground/50">Verified Views</div>
              <div className="font-bold">{submission.verified_views?.toLocaleString() ?? "—"}</div>
            </div>
            <div className="p-3 rounded-xl bg-secondary/20 border border-border/20">
              <div className="text-xs text-muted-foreground/50">Rate</div>
              <div className="font-bold">${rate}/{(rateUnit / 1000).toFixed(0)}K</div>
            </div>
          </div>

          {/* Video Links */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground/50 flex items-center gap-1"><ExternalLink className="h-3 w-3" /> Video Links</Label>
            {[submission.video_link_1, submission.video_link_2, submission.video_link_3].map((link, i) => (
              <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="block text-sm text-primary hover:underline truncate">
                Video {i + 1}: {link}
              </a>
            ))}
          </div>

          {/* Video Recordings */}
          <div>
            <Label className="text-xs text-muted-foreground/50 flex items-center gap-1 mb-2"><BarChart3 className="h-3 w-3" /> Video Analytics Recordings</Label>
            <ScreenshotGallery
              urls={recordingUrls}
              labels={["Video 1 Analytics", "Video 2 Analytics", "Video 3 Analytics"]}
            />
          </div>

          {/* Account Analytics */}
          <div>
            <Label className="text-xs text-muted-foreground/50 flex items-center gap-1 mb-2"><Users className="h-3 w-3" /> Account Analytics Recording</Label>
            <ScreenshotGallery urls={[accountRecordingUrl]} labels={["Account Analytics"]} />
          </div>


          {/* Admin Actions */}
          {(submission.status === "submitted" || submission.status === "under_review") && (
            <div className="space-y-4 p-4 rounded-xl bg-secondary/10 border border-border/20">
              <h4 className="text-sm font-semibold flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" /> Review Actions</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Verified Views</Label>
                  <Input
                    type="number"
                    value={verifiedViews}
                    onChange={(e) => setVerifiedViews(e.target.value)}
                    placeholder="Enter verified views"
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 flex flex-col justify-center">
                  <div className="text-xs text-muted-foreground/50">Estimated Earnings</div>
                  <div className="text-lg font-display font-bold text-primary">${estimatedEarnings.toFixed(2)}</div>
                </div>
              </div>
              <div>
                <Label className="text-xs">Internal Notes / Rejection Reason *</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Admin notes (required when rejecting)"
                  className="bg-secondary border-border"
                  rows={2}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleApprove}
                  disabled={reviewing}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" /> {reviewing ? "Reviewing..." : "Approve"}
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={reviewing}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" /> {reviewing ? "Reviewing..." : "Reject"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const AdminFinalReviews = () => {
  const { data: submissions, isLoading } = useAllFinalSubmissions();
  const [filter, setFilter] = useState<string>("all");

  const filtered = submissions?.filter(s => filter === "all" || s.status === filter) || [];

  return (
    <AppLayout title="Final Submission Reviews">
      <div className="page-enter space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {["all", "submitted", "under_review", "approved", "rejected", "paid"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "All" : f.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
              {f !== "all" && submissions && ` (${submissions.filter(s => s.status === f).length})`}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Eye} title="No submissions found" description="No final submissions match the selected filter" />
        ) : (
          <div className="space-y-4">
            {filtered.map((s) => <ReviewCard key={s.id} submission={s} />)}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AdminFinalReviews;
