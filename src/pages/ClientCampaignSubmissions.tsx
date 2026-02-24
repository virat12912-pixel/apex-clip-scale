import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/app/AppLayout";
import { useCampaign } from "@/hooks/useCampaigns";
import { useClientCampaignParticipants } from "@/hooks/useClientSubmissions";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronRight,
  Users,
  Eye,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

const ClientCampaignSubmissions = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const { data: campaign, isLoading: campaignLoading } = useCampaign(campaignId || "");
  const { data: participants, isLoading: participantsLoading } = useClientCampaignParticipants(campaignId || "");

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  if (campaignLoading) {
    return (
      <AppLayout title="Campaign Submissions">
        <Skeleton className="h-96 rounded-2xl" />
      </AppLayout>
    );
  }

  return (
    <AppLayout title={campaign?.name || "Campaign Submissions"}>
      <div className="page-enter">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 overflow-x-auto">
          <Link to="/client/submissions" className="hover:text-foreground transition-colors whitespace-nowrap">Campaigns</Link>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          <span className="text-foreground font-display truncate">{campaign?.name}</span>
        </div>

        {/* Campaign Stats */}
        {campaign && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 stagger-enter">
            <div className="p-4 rounded-2xl bg-card/50 border border-border/30">
              <div className="text-sm text-muted-foreground">Total Budget</div>
              <div className="text-xl font-display font-bold">${Number(campaign.total_budget).toFixed(0)}</div>
            </div>
            <div className="p-4 rounded-2xl bg-card/50 border border-border/30">
              <div className="text-sm text-muted-foreground">Spent</div>
              <div className="text-xl font-display font-bold text-primary">${Number(campaign.spent_budget).toFixed(2)}</div>
            </div>
            <div className="p-4 rounded-2xl bg-card/50 border border-border/30">
              <div className="text-sm text-muted-foreground">Status</div>
              <div className={`text-xl font-display font-bold capitalize ${
                campaign.status === "active" ? "text-emerald-400" :
                campaign.status === "paused" ? "text-yellow-400" :
                "text-muted-foreground"
              }`}>
                {campaign.status}
              </div>
            </div>
          </div>
        )}

        {/* Participants */}
        <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Participants ({participants?.length || 0})
        </h3>

        {participantsLoading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
        ) : participants?.length === 0 ? (
          <div className="p-8 rounded-2xl bg-card/50 border border-border/30 text-center text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No participants in this campaign</p>
          </div>
        ) : (
          <div className="space-y-3 stagger-enter">
            {participants?.map((participant) => (
              <Link
                key={participant.creator_id}
                to={`/client/submissions/${campaignId}/user/${participant.creator_id}`}
                className="block p-4 sm:p-5 rounded-2xl bg-card/50 border border-border/30 hover:border-primary/15 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-3 sm:mb-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-primary glow-primary-sm flex items-center justify-center text-base sm:text-lg font-bold text-primary-foreground overflow-hidden flex-shrink-0">
                    {participant.avatar_url ? (
                      <img src={participant.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      participant.full_name?.charAt(0) || "?"
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-bold truncate">{participant.full_name || "Anonymous"}</h3>
                    <p className="text-sm text-muted-foreground truncate">{participant.email}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 hidden sm:block" />
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/20 sm:border-0 sm:pt-0 sm:mt-0">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="flex items-center gap-1 text-emerald-400" title="Approved">
                      <CheckCircle className="h-4 w-4" />
                      {participant.approved_count || 0}
                    </span>
                    <span className="flex items-center gap-1 text-red-400" title="Rejected">
                      <XCircle className="h-4 w-4" />
                      {participant.rejected_count || 0}
                    </span>
                    <span className="flex items-center gap-1 text-yellow-400" title="Pending">
                      <Clock className="h-4 w-4" />
                      {participant.pending_count || 0}
                    </span>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{formatNumber(participant.total_views)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-primary">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-display font-bold">${participant.total_earnings.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ClientCampaignSubmissions;
