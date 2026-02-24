import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/app/AppLayout";
import { useCampaign } from "@/hooks/useCampaigns";
import { useClientUserSubmissions } from "@/hooks/useClientSubmissions";
import { Skeleton } from "@/components/ui/skeleton";
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
  AlertCircle,
} from "lucide-react";
import React from "react";

const platformIcons: Record<string, React.ReactNode> = {
  tiktok: <Smartphone className="h-4 w-4" />,
  instagram: <Camera className="h-4 w-4" />,
  youtube: <Play className="h-4 w-4" />,
};

const ClientUserSubmissions = () => {
  const { campaignId, userId } = useParams<{ campaignId: string; userId: string }>();
  const { data: campaign } = useCampaign(campaignId || "");
  const { data: submissions, isLoading: submissionsLoading } = useClientUserSubmissions(userId || "", campaignId || "");

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

  const totalViews = submissions?.reduce((sum, s: any) => sum + Number(s.views || 0), 0) || 0;
  const totalEarnings = submissions?.reduce((sum, s: any) => sum + Number(s.earnings || 0), 0) || 0;

  return (
    <AppLayout title="Creator Submissions">
      <div className="page-enter">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/client/submissions" className="hover:text-foreground transition-colors">Campaigns</Link>
          <ChevronRight className="h-4 w-4" />
          <Link to={`/client/submissions/${campaignId}`} className="hover:text-foreground transition-colors">
            {campaign?.name}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-display">Creator</span>
        </div>

        {/* Summary Stats */}
        <div className="p-6 rounded-2xl bg-card/50 border border-border/30 mb-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-display font-bold">{submissions?.length || 0}</div>
              <div className="text-sm text-muted-foreground">Clips</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-display font-bold flex items-center justify-center gap-1">
                <Eye className="h-5 w-5 text-muted-foreground" />
                {formatNumber(totalViews)}
              </div>
              <div className="text-sm text-muted-foreground">Total Views</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-display font-bold text-primary flex items-center justify-center gap-1">
                <DollarSign className="h-5 w-5" />
                {totalEarnings.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Earnings</div>
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
                <div key={sub.id} className="p-5 rounded-2xl bg-card/50 border border-border/30 hover:border-primary/15 transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className={`p-2 rounded-xl ${
                        sub.status === "pending"
                          ? "bg-yellow-500/10 text-yellow-400"
                          : sub.status === "approved" || sub.status === "paid"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-red-500/10 text-red-400"
                      }`}>
                        {platformIcons[sub.platform]}
                      </span>
                      <div>
                        <a
                          href={sub.clip_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 font-display font-bold"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View Clip
                        </a>
                        <p className="text-xs text-muted-foreground mt-1 max-w-md truncate">
                          {sub.clip_url}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(sub.status)}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-4 p-4 rounded-xl bg-secondary/20 border border-border/15">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-lg font-display font-bold">
                        <Eye className="h-5 w-5 text-muted-foreground" />
                        {currentViews.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">Views</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-lg font-display font-bold">
                        <Heart className="h-5 w-5 text-red-400" />
                        {Number(sub.likes || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">Likes</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-lg font-display font-bold">
                        <MessageCircle className="h-5 w-5 text-blue-400" />
                        {Number(sub.comments || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">Comments</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-lg font-display font-bold text-primary">
                        <DollarSign className="h-5 w-5" />
                        {Number(sub.earnings || 0).toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">Earnings</div>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground mt-3">
                    Submitted {new Date(sub.created_at).toLocaleDateString()} at {new Date(sub.created_at).toLocaleTimeString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ClientUserSubmissions;
