import { useState, useRef, useEffect } from "react";
import { Upload, Link2, BarChart3, CheckCircle, Lock, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useFinalSubmission, useCreateFinalSubmission, useResubmitFinalSubmission, MAX_FINAL_ATTEMPTS, uploadFinalSubmissionScreenshot, getFinalSubmissionFilePath, FinalSubmission } from "@/hooks/useFinalSubmissions";
import { FinalSubmissionTimeline } from "./FinalSubmissionTimeline";
import { validateClipUrl, SocialPlatform } from "@/lib/urlValidation";
import { supabase } from "@/integrations/supabase/client";

// Signed playback URLs expire after 300s. Refresh them on a 240s timer
// while mounted so a recording the admin/creator is still watching does
// not go dead mid-review (H-13).
const SIGNED_URL_TTL_SECONDS = 300;
const SIGNED_URL_REFRESH_MS = 240_000;

function useRefreshedSignedUrl(url: string | null): string | null {
  const [playableUrl, setPlayableUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      const path = getFinalSubmissionFilePath(url);
      if (!path) {
        setPlayableUrl(url);
        return;
      }
      supabase.storage.from("final-submissions").createSignedUrl(path, SIGNED_URL_TTL_SECONDS).then(({ data, error }) => {
        if (!cancelled) setPlayableUrl(error ? null : data.signedUrl);
      });
    };
    refresh();
    const timer = window.setInterval(refresh, SIGNED_URL_REFRESH_MS);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [url]);
  return playableUrl;
}

function RecordingUploader({ label, onUpload, onRemove, uploading, url }: {
  label: string;
  onUpload: (file: File) => void;
  onRemove: () => void;
  uploading: boolean;
  url: string | null;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const playableUrl = useRefreshedSignedUrl(url);
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <input type="file" ref={ref} accept="video/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) onUpload(file); e.target.value = ""; }} />
      {url ? (
        <div className="space-y-2">
          {playableUrl ? <video src={playableUrl} controls className="w-full h-40 rounded-lg border border-border/30 bg-black object-contain" /> : <p className="text-xs text-muted-foreground">Loading recording…</p>}
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => ref.current?.click()} disabled={uploading} className="flex-1 rounded-lg">
              Replace
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={onRemove} disabled={uploading} className="flex-1 rounded-lg text-destructive hover:bg-destructive/10">
              Remove
            </Button>
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
          <span className="text-xs">{uploading ? "Uploading..." : "Upload screen recording"}</span>
        </button>
      )}
    </div>
  );
}

function ImageUploader({ label, onUpload, onRemove, uploading, url }: {
  label: string;
  onUpload: (file: File) => void;
  onRemove: () => void;
  uploading: boolean;
  url: string | null;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const playableUrl = useRefreshedSignedUrl(url);
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <input type="file" ref={ref} accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) onUpload(file); e.target.value = ""; }} />
      {url ? (
        <div className="space-y-2">
          {playableUrl ? <img src={playableUrl} alt={label} className="w-full h-40 rounded-lg border border-border/30 bg-black object-contain" /> : <p className="text-xs text-muted-foreground">Loading screenshot…</p>}
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => ref.current?.click()} disabled={uploading} className="flex-1 rounded-lg">
              Replace
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={onRemove} disabled={uploading} className="flex-1 rounded-lg text-destructive hover:bg-destructive/10">
              Remove
            </Button>
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

interface FinalSubmissionFormProps {
  campaignId: string;
  campaignStatus: string;
  trackedViews: number;
}

export function FinalSubmissionForm({ campaignId, campaignStatus, trackedViews }: FinalSubmissionFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: existing, isLoading } = useFinalSubmission(campaignId);
  const createFinalSubmission = useCreateFinalSubmission();
  const resubmit = useResubmitFinalSubmission();

  const isCampaignEnded = campaignStatus === "completed";

  const [videoLink1, setVideoLink1] = useState("");
  const [videoLink2, setVideoLink2] = useState("");
  const [videoLink3, setVideoLink3] = useState("");
  const [videoScreenshot1, setVideoScreenshot1] = useState<string | null>(null);
  const [videoScreenshot2, setVideoScreenshot2] = useState<string | null>(null);
  const [videoScreenshot3, setVideoScreenshot3] = useState<string | null>(null);
  const [accountScreenshot, setAccountScreenshot] = useState<string | null>(null);
  const [demographicsScreenshot, setDemographicsScreenshot] = useState<string | null>(null);
  // H-13: attestations are collected from the creator — never hardcoded.
  const [followersCount, setFollowersCount] = useState("");
  const [ranPaidAds, setRanPaidAds] = useState(false);
  const [videosDeleted, setVideosDeleted] = useState(false);
  const [contentIsOriginal, setContentIsOriginal] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  if (isLoading) return null;

  // If not completed campaign, don't show
  if (!isCampaignEnded) return null;

  const attemptsUsed = existing?.attempt_count ?? 1;
  const resendsLeft = MAX_FINAL_ATTEMPTS - attemptsUsed;
  const canResubmit = existing?.status === "rejected" && resendsLeft > 0;

  const MAX_RECORDING_BYTES = 100 * 1024 * 1024; // 100 MB per screen recording
  const MAX_SCREENSHOT_BYTES = 10 * 1024 * 1024; // 10 MB per screenshot

  const handleUpload = async (file: File, label: string, setter: (url: string | null) => void, kind: "recording" | "screenshot") => {
    if (!user) return;
    // `accept=` on the input is advisory only — enforce type + size here.
    if (kind === "recording" && !file.type.startsWith("video/")) {
      toast({ title: "Invalid file", description: "Please upload a video recording.", variant: "destructive" });
      return;
    }
    if (kind === "screenshot" && !file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image screenshot.", variant: "destructive" });
      return;
    }
    const maxBytes = kind === "recording" ? MAX_RECORDING_BYTES : MAX_SCREENSHOT_BYTES;
    if (file.size > maxBytes) {
      toast({ title: "File too large", description: `Maximum file size is ${maxBytes / (1024 * 1024)}MB.`, variant: "destructive" });
      return;
    }
    setUploading(p => ({ ...p, [label]: true }));
    try {
      const url = await uploadFinalSubmissionScreenshot(user.id, campaignId, file, label);
      setter(url);
    } catch (err: unknown) {
      toast({ title: "Upload failed", description: err instanceof Error ? err.message : "Upload failed", variant: "destructive" });
    } finally {
      setUploading(p => ({ ...p, [label]: false }));
    }
  };

  // A link is valid if it is a well-formed clip URL on ANY supported
  // platform (final submissions mix platforms) — whitespace-only or
  // malformed links are rejected (H-13).
  const validateVideoLink = (link: string, index: number): string | null => {
    const trimmed = link.trim();
    if (!trimmed) return `Video ${index} link is required`;
    const platforms: SocialPlatform[] = ["tiktok", "instagram", "youtube"];
    if (platforms.some((platform) => validateClipUrl(trimmed, platform) === null)) return null;
    return `Video ${index} link is not a valid TikTok, Instagram or YouTube clip URL`;
  };

  const handleSubmit = async () => {
    const linkErrors = [videoLink1, videoLink2, videoLink3]
      .map((link, i) => validateVideoLink(link, i + 1))
      .filter((e): e is string => e !== null);
    if (linkErrors.length > 0) {
      toast({ title: "Invalid video links", description: linkErrors.join(" "), variant: "destructive" });
      return;
    }
    if (!videoScreenshot1 || !videoScreenshot2 || !videoScreenshot3) {
      toast({ title: "Please upload screen recordings for all 3 videos", variant: "destructive" });
      return;
    }
    if (!accountScreenshot) {
      toast({ title: "Please upload the account analytics recording", variant: "destructive" });
      return;
    }
    if (!demographicsScreenshot) {
      toast({ title: "Demographics screenshot required", description: "Upload the demographics screenshot — payouts are verified against it.", variant: "destructive" });
      return;
    }
    const followers = Number(followersCount);
    if (!Number.isFinite(followers) || followers < 0 || !Number.isInteger(followers)) {
      toast({ title: "Followers count required", description: "Enter your current follower count (0 or more).", variant: "destructive" });
      return;
    }
    if (!contentIsOriginal) {
      toast({ title: "Originality attestation required", description: "Confirm the content is original to submit.", variant: "destructive" });
      return;
    }

    try {
      if (canResubmit && existing) {
        await resubmit.mutateAsync({
          id: existing.id,
          attempt_count: existing.attempt_count ?? 1,
          video_link_1: videoLink1.trim(), video_link_2: videoLink2.trim(), video_link_3: videoLink3.trim(),
          video_screenshot_1: videoScreenshot1, video_screenshot_2: videoScreenshot2, video_screenshot_3: videoScreenshot3,
          account_analytics_screenshot: accountScreenshot,
          demographics_screenshot: demographicsScreenshot,
          followers_count: followers,
          ran_paid_ads: ranPaidAds,
          videos_deleted: videosDeleted,
          content_is_original: contentIsOriginal,
        });
        toast({ title: "Analytics resent!", description: "Your submission is back under review." });
        return;
      }
      await createFinalSubmission.mutateAsync({
        campaign_id: campaignId,
        video_link_1: videoLink1.trim(),
        video_link_2: videoLink2.trim(),
        video_link_3: videoLink3.trim(),
        video_screenshot_1: videoScreenshot1,
        video_screenshot_2: videoScreenshot2,
        video_screenshot_3: videoScreenshot3,
        followers_count: followers,
        account_analytics_screenshot: accountScreenshot,
        demographics_screenshot: demographicsScreenshot,
        ran_paid_ads: ranPaidAds,
        videos_deleted: videosDeleted,
        content_is_original: contentIsOriginal,
        tracked_views: trackedViews,
      });
      toast({ title: "Final submission sent!", description: "Your submission is now under review." });
    } catch (err: unknown) {
      toast({ title: "Submission failed", description: err instanceof Error ? err.message : "Submission failed", variant: "destructive" });
    }
  };

  // If already submitted, show locked view (unless rejected with attempts left)
  if (existing && !canResubmit) {
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

      {canResubmit && existing && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
          <div>
            <h4 className="font-display font-bold text-destructive">Your analytics were REJECTED</h4>
            {existing.admin_notes && <p className="text-sm text-destructive/80 mt-1">Reason: {existing.admin_notes}</p>}
            <p className="text-xs text-muted-foreground mt-2">Fix the issue above and resend. {resendsLeft} resend{resendsLeft !== 1 ? "s" : ""} left.</p>
          </div>
        </div>
      )}

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
            <RecordingUploader
              label={`Analytics screen recording (Video ${i + 1})`}
              onUpload={(f) => handleUpload(f, v.label, v.setSs, "recording")}
              onRemove={() => v.setSs(null)}
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
          <RecordingUploader
            label="Account analytics screen recording"
            onUpload={(f) => handleUpload(f, "account-analytics", setAccountScreenshot, "recording")}
            onRemove={() => setAccountScreenshot(null)}
            uploading={!!uploading["account-analytics"]}
            url={accountScreenshot}
          />
        </div>
      </div>

      {/* Demographics — required: payouts are verified against this screenshot */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <BarChart3 className="h-4 w-4 text-primary" /> Demographics
        </div>
        <div className="p-4 rounded-xl bg-secondary/20 border border-border/20 space-y-3">
          <ImageUploader
            label="Demographics screenshot (required)"
            onUpload={(f) => handleUpload(f, "demographics", setDemographicsScreenshot, "screenshot")}
            onRemove={() => setDemographicsScreenshot(null)}
            uploading={!!uploading["demographics"]}
            url={demographicsScreenshot}
          />
          <p className="text-xs text-muted-foreground">Screenshot of your audience demographics — admins verify payouts against it.</p>
        </div>
      </div>

      {/* Attestations — answered by the creator, never pre-filled */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <CheckCircle className="h-4 w-4 text-primary" /> Attestations
        </div>
        <div className="p-4 rounded-xl bg-secondary/20 border border-border/20 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs" htmlFor="followers-count">Follower count *</Label>
            <Input
              id="followers-count"
              type="number"
              min={0}
              step={1}
              placeholder="e.g. 12500"
              value={followersCount}
              onChange={(e) => setFollowersCount(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={ranPaidAds} onChange={(e) => setRanPaidAds(e.target.checked)} className="h-4 w-4 accent-primary" />
            I ran paid ads on these videos
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={videosDeleted} onChange={(e) => setVideosDeleted(e.target.checked)} className="h-4 w-4 accent-primary" />
            I deleted any of these videos after posting
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={contentIsOriginal} onChange={(e) => setContentIsOriginal(e.target.checked)} className="h-4 w-4 accent-primary" />
            This content is original — I created it myself *
          </label>
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={createFinalSubmission.isPending || resubmit.isPending}
        className="w-full bg-gradient-primary hover:opacity-90 btn-shimmer rounded-xl font-display font-bold h-12"
      >
        {createFinalSubmission.isPending || resubmit.isPending ? "Submitting..." : canResubmit ? "Resend Analytics" : "Submit Final Report"}
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
            <p className="text-xs text-muted-foreground mt-1">No resend attempts left.</p>
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

    </div>
  );
}
