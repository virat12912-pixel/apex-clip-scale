import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/app/AppLayout";
import { useMySubmissions } from "@/hooks/useSubmissions";
import { useCampaign } from "@/hooks/useCampaigns";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";
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
  Film,
} from "lucide-react";

const platformIcons: Record<string, React.ReactNode> = {
  tiktok: <Smartphone className="h-4 w-4" />,
  instagram: <Camera className="h-4 w-4" />,
  youtube: <Play className="h-4 w-4" />,
};

const MySubmissionClips = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const { data: allSubmissions, isLoading } = useMySubmissions();
  const { data: campaign } = useCampaign(campaignId || "");

  const submissions = useMemo(() => {
    if (!allSubmissions || !campaignId) return [];
    return allSubmissions.filter((s: any) => s.campaign_id === campaignId);
  }, [allSubmissions, campaignId]);

  const totalViews = submissions.reduce((sum, s: any) => sum + Number(s.views || 0), 0);
  const totalEarnings = submissions.reduce((sum, s: any) => sum + Number(s.earnings || 0), 0);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
      case "paid":
        return <span className="px-2 py-1 rounded-lg text-xs bg-emerald-500/10 text-emerald-400">{status}</span>;
      case "rejected":
        return <span className="px-2 py-1 rounded-lg text-xs bg-red-500/10 text-red-400">{status}</span>;
      default:
        return <span className="px-2 py-1 rounded-lg text-xs bg-yellow-500/10 text-yellow-400">{status}</span>;
    }
  };

  return (
    <AppLayout title={campaign?.name || "Submissions"}>
      <div className="max-w-4xl mx-auto page-enter">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/my-submissions" className="hover:text-foreground transition-colors">My Submissions</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-display">{campaign?.name || "Campaign"}</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6 stagger-enter">
          <div className="p-4 rounded-2xl bg-card/50 border border-border/30 text-center">
            <div className="text-xl font-display font-bold">{submissions.length}</div>
            <div className="text-xs text-muted-foreground">Clips</div>
          </div>
          <div className="p-4 rounded-2xl bg-card/50 border border-border/30 text-center">
            <div className="text-xl font-display font-bold flex items-center justify-center gap-1">
              <Eye className="h-4 w-4 text-muted-foreground" />
              {formatNumber(totalViews)}
            </div>
            <div className="text-xs text-muted-foreground">Views</div>
          </div>
          <div className="p-4 rounded-2xl bg-card/50 border border-border/30 text-center">
            <div className="text-xl font-display font-bold text-primary flex items-center justify-center gap-1">
              <DollarSign className="h-4 w-4" />
              {totalEarnings.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">Earnings</div>
          </div>
        </div>

        {/* Clips List */}
        <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
          <Film className="h-5 w-5 text-primary" />
          Clips ({submissions.length})
        </h3>

        {isLoading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-8 rounded-2xl bg-card/50 border border-border/30 text-center text-muted-foreground">
            No submissions for this campaign
          </div>
        ) : (
          <div className="space-y-4 stagger-enter">
            {submissions.map((sub: any) => (
              <div key={sub.id} className="p-4 sm:p-5 rounded-2xl bg-card/50 border border-border/30 hover:border-primary/15 transition-all duration-300">
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <span className={`p-1.5 sm:p-2 rounded-xl flex-shrink-0 ${
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
                        <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                        View Clip
                      </a>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px] sm:max-w-md">
                        {sub.clip_url}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(sub.status)}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 p-3 sm:p-4 rounded-xl bg-secondary/20 border border-border/15">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-sm sm:text-lg font-display font-bold">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      {Number(sub.views || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">Views</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-sm sm:text-lg font-display font-bold">
                      <Heart className="h-4 w-4 text-red-400" />
                      {Number(sub.likes || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">Likes</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-sm sm:text-lg font-display font-bold">
                      <MessageCircle className="h-4 w-4 text-blue-400" />
                      {Number(sub.comments || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">Comments</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-sm sm:text-lg font-display font-bold text-primary">
                      <DollarSign className="h-4 w-4" />
                      {Number(sub.earnings || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">Earnings</div>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground mt-3">
                  Submitted {new Date(sub.created_at).toLocaleDateString()} at {new Date(sub.created_at).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default MySubmissionClips;
