import { AppLayout } from "@/components/app/AppLayout";
import { useMySubmissions } from "@/hooks/useSubmissions";
import { useCampaigns } from "@/hooks/useCampaigns";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/ui/empty-state";
import { useMemo } from "react";
import {
  ChevronRight,
  Film,
  Eye,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

interface CampaignGroup {
  campaign_id: string;
  campaign_name: string;
  campaign_status: string;
  approved_count: number;
  rejected_count: number;
  pending_count: number;
  total_views: number;
  total_earnings: number;
  total_clips: number;
}

const MySubmissions = () => {
  const { data: submissions, isLoading } = useMySubmissions();

  const campaignGroups = useMemo(() => {
    if (!submissions) return [];
    const grouped = new Map<string, CampaignGroup>();

    submissions.forEach((sub: any) => {
      const cid = sub.campaign_id;
      const cname = sub.campaign?.name || "Unknown Campaign";
      const cstatus = sub.campaign?.status || "active";

      if (!grouped.has(cid)) {
        grouped.set(cid, {
          campaign_id: cid,
          campaign_name: cname,
          campaign_status: cstatus,
          approved_count: 0,
          rejected_count: 0,
          pending_count: 0,
          total_views: 0,
          total_earnings: 0,
          total_clips: 0,
        });
      }

      const entry = grouped.get(cid)!;
      entry.total_clips += 1;
      entry.total_views += Number(sub.views || 0);
      entry.total_earnings += Number(sub.earnings || 0);

      if (sub.status === "approved" || sub.status === "paid") entry.approved_count += 1;
      else if (sub.status === "rejected") entry.rejected_count += 1;
      else if (sub.status === "pending") entry.pending_count += 1;
    });

    return Array.from(grouped.values()).sort((a, b) => b.total_earnings - a.total_earnings);
  }, [submissions]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  return (
    <AppLayout title="My Submissions">
      <div className="page-enter">
        {/* Campaign List */}
        <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
          <Film className="h-5 w-5 text-primary" />
          Campaigns ({campaignGroups.length})
        </h3>

        {isLoading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
        ) : campaignGroups.length === 0 ? (
          <EmptyState
            icon={Film}
            title="No submissions yet"
            description="Submit clips to campaigns to see them here"
            variant="gradient"
            action={{ label: "Browse Campaigns", onClick: () => window.location.href = "/campaigns" }}
          />
        ) : (
          <div className="space-y-3 stagger-enter">
            {campaignGroups.map((campaign) => (
              <Link
                key={campaign.campaign_id}
                to={`/my-submissions/${campaign.campaign_id}`}
                className="block p-4 sm:p-5 rounded-2xl bg-card/50 border border-border/30 hover:border-primary/15 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-display font-bold">{campaign.campaign_name}</h4>
                    <span className={`text-xs capitalize ${
                      campaign.campaign_status === "active" ? "text-emerald-400" :
                      campaign.campaign_status === "completed" ? "text-muted-foreground" :
                      "text-yellow-400"
                    }`}>
                      {campaign.campaign_status}
                    </span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle className="h-4 w-4" /> {campaign.approved_count}
                  </span>
                  {campaign.rejected_count > 0 && (
                    <span className="flex items-center gap-1 text-red-400">
                      <XCircle className="h-4 w-4" /> {campaign.rejected_count}
                    </span>
                  )}
                  {campaign.pending_count > 0 && (
                    <span className="flex items-center gap-1 text-yellow-400">
                      <Clock className="h-4 w-4" /> {campaign.pending_count}
                    </span>
                  )}
                  <span className="ml-auto flex items-center gap-1">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    {formatNumber(campaign.total_views)}
                  </span>
                  <span className="flex items-center gap-1 text-primary font-display font-bold">
                    <DollarSign className="h-4 w-4" />
                    ${campaign.total_earnings.toFixed(2)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default MySubmissions;
