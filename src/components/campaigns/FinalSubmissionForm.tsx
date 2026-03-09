import { useState, useRef } from "react";
import { Upload, Link2, Users, BarChart3, Globe, CheckCircle, Lock, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useFinalSubmission, useCreateFinalSubmission, uploadFinalSubmissionScreenshot, FinalSubmission } from "@/hooks/useFinalSubmissions";
import { FinalSubmissionTimeline } from "./FinalSubmissionTimeline";

interface FinalSubmissionFormProps {
  campaignId: string;
  campaignStatus: string;
  trackedViews: number;
  isRelaunched?: boolean;
}

function ScreenshotUploader({ label, onUpload, uploading, url }: {
  label: string;
  onUpload: (file: File) => void;
  uploading: boolean;
  url: string | null;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <input type="file" ref={ref} accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
      {url ? (
        <div className="relative group">
          <img src={url} alt={label} className="w-full h-32 object-cover rounded-lg border border-border/30 cursor-pointer" onClick={() => window.open(url, "_blank")} />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <span className="text-xs text-white">Click to view full</span>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={uploading}
          className="w-full h-32 border-2 border-dashed border-border/50 rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground/60 hover:border-primary/30 hover:text-primary/60 transition-all"
        >
          {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
          <span className="text-xs">{uploading ? "Uploading..." : "Upload screenshot"}</span>
        </button>
      )}
    </div>
  );
}

export function FinalSubmissionForm({ campaignId, campaignStatus, trackedViews }: FinalSubmissionFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: existing, isLoading } = useFinalSubmission(campaignId);
  const createFinalSubmission = useCreateFinalSubmission();

  const isCampaignEnded = campaignStatus === "completed";

  const [videoLink1, setVideoLink1] = useState("");
  const [videoLink2, setVideoLink2] = useState("");
  const [videoLink3, setVideoLink3] = useState("");
  const [videoScreenshot1, setVideoScreenshot1] = useState<string | null>(null);
  const [videoScreenshot2, setVideoScreenshot2] = useState<string | null>(null);
  const [videoScreenshot3, setVideoScreenshot3] = useState<string | null>(null);
  const [followersCount, setFollowersCount] = useState("");
  const [accountScreenshot, setAccountScreenshot] = useState<string | null>(null);
  const [demographicsScreenshot, setDemographicsScreenshot] = useState<string | null>(null);
  const [ranPaidAds, setRanPaidAds] = useState(false);
  const [videosDeleted, setVideosDeleted] = useState(false);
  const [contentOriginal, setContentOriginal] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  if (isLoading) return null;

  // If not completed campaign, don't show
  if (!isCampaignEnded) return null;

  const handleUpload = async (file: File, label: string, setter: (url: string) => void) => {
    if (!user) return;
    setUploading(p => ({ ...p, [label]: true }));
    try {
      const url = await uploadFinalSubmissionScreenshot(user.id, campaignId, file, label);
      setter(url);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(p => ({ ...p, [label]: false }));
    }
  };

  const handleSubmit = async () => {
    if (!videoLink1 || !videoLink2 || !videoLink3) {
      toast({ title: "All 3 video links required", variant: "destructive" });
      return;
    }
    if (!followersCount || isNaN(Number(followersCount))) {
      toast({ title: "Valid followers count required", variant: "destructive" });
      return;
    }
    if (!contentOriginal) {
      toast({ title: "Please confirm content is original", variant: "destructive" });
      return;
    }
    if (!videoScreenshot1 || !videoScreenshot2 || !videoScreenshot3) {
      toast({ title: "Please upload analytics screenshots for all 3 videos", variant: "destructive" });
      return;
    }
    if (!accountScreenshot) {
      toast({ title: "Please upload account analytics screenshot", variant: "destructive" });
      return;
    }
    if (!demographicsScreenshot) {
      toast({ title: "Please upload demographics screenshot", variant: "destructive" });
      return;
    }

    try {
      await createFinalSubmission.mutateAsync({
        campaign_id: campaignId,
        video_link_1: videoLink1,
        video_link_2: videoLink2,
        video_link_3: videoLink3,
        video_screenshot_1: videoScreenshot1,
        video_screenshot_2: videoScreenshot2,
        video_screenshot_3: videoScreenshot3,
        followers_count: Number(followersCount),
        account_analytics_screenshot: accountScreenshot,
        demographics_screenshot: demographicsScreenshot,
        ran_paid_ads: ranPaidAds,
        videos_deleted: videosDeleted,
        content_is_original: contentOriginal,
        tracked_views: trackedViews,
      });
      toast({ title: "Final submission sent!", description: "Your submission is now under review." });
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    }
  };

  // If already submitted, show locked view
  if (existing) {
    return <LockedFinalSubmission submission={existing} />;
  }

  return (
    <div className="p-6 rounded-2xl bg-card/50 border border-primary/20 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/10">
          <CheckCircle className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-display font-bold">Final Submission</h3>
          <p className="text-sm text-muted-foreground/60">Campaign ended — submit your final report</p>
        </div>
      </div>

      {/* Top 3 Performing Videos */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Link2 className="h-4 w-4 text-primary" /> Top 3 Performing Videos
        </div>
        {[
          { val: videoLink1, set: setVideoLink1, ss: videoScreenshot1, setSs: setVideoScreenshot1, label: "video-1" },
          { val: videoLink2, set: setVideoLink2, ss: videoScreenshot2, setSs: setVideoScreenshot2, label: "video-2" },
          { val: videoLink3, set: setVideoLink3, ss: videoScreenshot3, setSs: setVideoScreenshot3, label: "video-3" },
        ].map((v, i) => (
          <div key={i} className="p-4 rounded-xl bg-secondary/20 border border-border/20 space-y-3">
            <Label className="text-xs">Video {i + 1} Link</Label>
            <Input placeholder="https://tiktok.com/..." value={v.val} onChange={(e) => v.set(e.target.value)} className="bg-secondary border-border" />
            <ScreenshotUploader
              label={`Analytics screenshot (Video ${i + 1})`}
              onUpload={(f) => handleUpload(f, v.label, v.setSs as (url: string) => void)}
              uploading={!!uploading[v.label]}
              url={v.ss}
            />
          </div>
        ))}
      </div>

      {/* Account Analytics */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <BarChart3 className="h-4 w-4 text-primary" /> Account Analytics
        </div>
        <div className="p-4 rounded-xl bg-secondary/20 border border-border/20 space-y-3">
          <Label className="text-xs">Current Followers Count</Label>
          <Input type="number" placeholder="e.g. 15000" value={followersCount} onChange={(e) => setFollowersCount(e.target.value)} className="bg-secondary border-border" />
          <ScreenshotUploader
            label="Account analytics screenshot"
            onUpload={(f) => handleUpload(f, "account-analytics", setAccountScreenshot)}
            uploading={!!uploading["account-analytics"]}
            url={accountScreenshot}
          />
        </div>
      </div>

      {/* Demographics */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Globe className="h-4 w-4 text-primary" /> Account Demographics
        </div>
        <div className="p-4 rounded-xl bg-secondary/20 border border-border/20">
          <ScreenshotUploader
            label="Demographics (countries, gender, age distribution)"
            onUpload={(f) => handleUpload(f, "demographics", setDemographicsScreenshot)}
            uploading={!!uploading["demographics"]}
            url={demographicsScreenshot}
          />
        </div>
      </div>

      {/* Confirmation Checklist */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <CheckCircle className="h-4 w-4 text-primary" /> Confirmation Checklist
        </div>
        <div className="space-y-3 p-4 rounded-xl bg-secondary/20 border border-border/20">
          <div className="flex items-center gap-3">
            <Checkbox id="paid-ads" checked={ranPaidAds} onCheckedChange={(c) => setRanPaidAds(c === true)} />
            <label htmlFor="paid-ads" className="text-sm cursor-pointer">I ran paid ads on my content</label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox id="deleted" checked={videosDeleted} onCheckedChange={(c) => setVideosDeleted(c === true)} />
            <label htmlFor="deleted" className="text-sm cursor-pointer">Some videos were deleted</label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox id="original" checked={contentOriginal} onCheckedChange={(c) => setContentOriginal(c === true)} />
            <label htmlFor="original" className="text-sm cursor-pointer">I confirm all content is original *</label>
          </div>
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={createFinalSubmission.isPending || !contentOriginal}
        className="w-full bg-gradient-primary hover:opacity-90 btn-shimmer rounded-xl font-display font-bold h-12"
      >
        {createFinalSubmission.isPending ? "Submitting..." : "Submit Final Report"}
      </Button>
    </div>
  );
}

function LockedFinalSubmission({ submission }: { submission: FinalSubmission }) {
  const isApproved = submission.status === "approved" || submission.status === "paid";
  const isRejected = submission.status === "rejected";

  return (
    <div className={`p-6 rounded-2xl bg-card/50 border space-y-5 ${isApproved ? "border-emerald-500/30" : isRejected ? "border-destructive/30" : "border-border/30"}`}>
      {/* Approval / Rejection Banner */}
      {isApproved && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-display font-bold text-emerald-400">Your submission has been approved!</h4>
            <p className="text-sm text-emerald-400/70 mt-1">You are eligible for payouts. Your verified earnings are <span className="font-bold">${Number(submission.final_earnings || 0).toFixed(2)}</span>.</p>
          </div>
        </div>
      )}
      {isRejected && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
          <div>
            <h4 className="font-display font-bold text-destructive">Your submission has been rejected</h4>
            {submission.admin_notes && <p className="text-sm text-destructive/70 mt-1">Reason: {submission.admin_notes}</p>}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-emerald-500/10">
          <Lock className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-display font-bold">Final Submission</h3>
          <p className="text-sm text-muted-foreground/60">
            {submission.status === "submitted" ? "Submitted — awaiting review" 
              : submission.status === "under_review" ? "Under review by admin"
              : submission.status === "approved" ? "Approved — eligible for payout"
              : submission.status === "paid" ? "Paid out"
              : submission.status === "rejected" ? "Rejected"
              : submission.status}
          </p>
        </div>
      </div>

      <FinalSubmissionTimeline status={submission.status} />

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-secondary/20 border border-border/20">
          <div className="text-xs text-muted-foreground/50">Tracked Views</div>
          <div className="font-display font-bold">{submission.tracked_views.toLocaleString()}</div>
        </div>
        <div className="p-3 rounded-xl bg-secondary/20 border border-border/20">
          <div className="text-xs text-muted-foreground/50">Verified Views</div>
          <div className="font-display font-bold">{submission.verified_views?.toLocaleString() ?? "Pending"}</div>
        </div>
        <div className="p-3 rounded-xl bg-secondary/20 border border-border/20">
          <div className="text-xs text-muted-foreground/50">Earnings</div>
          <div className="font-display font-bold text-primary">${Number(submission.final_earnings || 0).toFixed(2)}</div>
        </div>
        <div className="p-3 rounded-xl bg-secondary/20 border border-border/20">
          <div className="text-xs text-muted-foreground/50">Followers</div>
          <div className="font-display font-bold">{submission.followers_count.toLocaleString()}</div>
        </div>
      </div>

      {/* Video links */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground/50">Top 3 Videos</Label>
        {[submission.video_link_1, submission.video_link_2, submission.video_link_3].map((link, i) => (
          <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="block text-sm text-primary hover:underline truncate">
            {i + 1}. {link}
          </a>
        ))}
      </div>

      {/* Checklist */}
      <div className="flex flex-wrap gap-3 text-xs">
        <span className={`px-2.5 py-1 rounded-lg ${submission.ran_paid_ads ? "bg-yellow-500/10 text-yellow-400" : "bg-emerald-500/10 text-emerald-400"}`}>
          {submission.ran_paid_ads ? "Ran paid ads" : "No paid ads"}
        </span>
        <span className={`px-2.5 py-1 rounded-lg ${submission.videos_deleted ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>
          {submission.videos_deleted ? "Some videos deleted" : "No videos deleted"}
        </span>
        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400">
          Original content ✓
        </span>
      </div>
    </div>
  );
}
