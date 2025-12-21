import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/app/AppLayout";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useCampaignParticipants } from "@/hooks/useAdminUsers";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ChevronRight, 
  Users, 
  Eye, 
  DollarSign, 
  AlertCircle,
  CheckCircle,
  Clock,
  Ban
} from "lucide-react";

const AdminCampaignPayouts = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const { data: campaigns, isLoading: campaignsLoading } = useCampaigns();
  const { data: participants, isLoading: participantsLoading } = useCampaignParticipants(campaignId || "");

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const getPayoutStatusBadge = (status: string) => {
    switch (status) {
      case "eligible":
        return <span className="px-2 py-1 rounded-full text-xs bg-emerald-500/10 text-emerald-400 flex items-center gap-1"><CheckCircle className="h-3 w-3" />Eligible</span>;
      case "pending":
        return <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/10 text-yellow-400 flex items-center gap-1"><Clock className="h-3 w-3" />Pending</span>;
      case "paid":
        return <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary flex items-center gap-1"><DollarSign className="h-3 w-3" />Paid</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-xs bg-secondary text-muted-foreground">Not Eligible</span>;
    }
  };

  // Campaign list view
  if (!campaignId) {
    return (
      <AppLayout title="Payout Management">
        <p className="text-muted-foreground mb-6">Select a campaign to view payout details</p>
        
        {campaignsLoading ? (
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : campaigns?.length === 0 ? (
          <div className="p-8 rounded-xl bg-card border border-border text-center text-muted-foreground">
            No campaigns found
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns?.map((campaign) => (
              <Link
                key={campaign.id}
                to={`/admin/payouts/campaign/${campaign.id}`}
                className="flex items-center justify-between p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {campaign.image_url ? (
                    <img src={campaign.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center text-lg font-bold text-primary-foreground">
                      {campaign.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold">{campaign.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      ${Number(campaign.spent_budget).toFixed(0)} / ${Number(campaign.total_budget).toFixed(0)} spent
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-xs capitalize ${
                    campaign.status === "active" ? "bg-emerald-500/10 text-emerald-400" :
                    campaign.status === "paused" ? "bg-yellow-500/10 text-yellow-400" :
                    "bg-secondary text-muted-foreground"
                  }`}>
                    {campaign.status}
                  </span>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </AppLayout>
    );
  }

  // Campaign participants view
  const selectedCampaign = campaigns?.find(c => c.id === campaignId);

  return (
    <AppLayout title={selectedCampaign?.name || "Campaign Payouts"}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to="/admin/payouts" className="hover:text-foreground transition-colors">Campaigns</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{selectedCampaign?.name}</span>
      </div>

      {participantsLoading ? (
        <div className="space-y-4">
          {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : participants?.length === 0 ? (
        <div className="p-8 rounded-xl bg-card border border-border text-center text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>No participants in this campaign</p>
        </div>
      ) : (
        <div className="space-y-3">
          {participants?.map((participant) => (
            <Link
              key={participant.creator_id}
              to={`/admin/payouts/campaign/${campaignId}/user/${participant.creator_id}`}
              className="flex items-center justify-between p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-lg font-bold text-primary-foreground overflow-hidden">
                    {participant.avatar_url ? (
                      <img src={participant.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      participant.full_name?.charAt(0) || "?"
                    )}
                  </div>
                  {participant.is_banned && (
                    <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-0.5">
                      <Ban className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{participant.full_name || "Anonymous"}</h3>
                    {!participant.payment_verified && (
                      <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/10 text-yellow-400">Unverified</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{participant.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{formatNumber(participant.total_views)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-primary">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-medium">${participant.total_earnings.toFixed(2)}</span>
                  </div>
                </div>

                {getPayoutStatusBadge(participant.payout_status)}

                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default AdminCampaignPayouts;
