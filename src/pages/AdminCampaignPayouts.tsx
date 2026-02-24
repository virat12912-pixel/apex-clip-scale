import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/app/AppLayout";
import { useCampaigns } from "@/hooks/useCampaigns";
import {
  useCampaignParticipants,
  useUpdateUserStatus,
} from "@/hooks/useAdminUsers";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronRight,
  Users,
  Eye,
  DollarSign,
  CheckCircle,
  Clock,
  Ban,
  Video,
  XCircle,
  Wallet,
  Shield,
} from "lucide-react";

const AdminCampaignPayouts = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const { data: campaigns, isLoading: campaignsLoading } = useCampaigns();
  const { data: participants, isLoading: participantsLoading } =
    useCampaignParticipants(campaignId || "");
  const { toast } = useToast();
  const updateUserStatus = useUpdateUserStatus(campaignId);

  const handleVerifyPayment = async (userId: string) => {
    try {
      await updateUserStatus.mutateAsync({
        userId: userId!,
        updates: { payment_verified: true },
        action: "verify_payment",
      });
      toast({ title: "Payment method verified" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const getPayoutStatusBadge = (status: string) => {
    switch (status) {
      case "eligible":
        return (
          <span className="px-2 py-1 rounded-lg text-xs bg-emerald-500/10 text-emerald-400 backdrop-blur-sm flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Eligible
          </span>
        );
      case "pending":
        return (
          <span className="px-2 py-1 rounded-lg text-xs bg-yellow-500/10 text-yellow-400 backdrop-blur-sm flex items-center gap-1">
            <Clock className="h-3 w-3" /> Pending
          </span>
        );
      case "paid":
        return (
          <span className="px-2 py-1 rounded-lg text-xs bg-primary/10 text-primary backdrop-blur-sm flex items-center gap-1">
            <DollarSign className="h-3 w-3" /> Paid
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-lg text-xs bg-secondary text-muted-foreground backdrop-blur-sm">
            Not Eligible
          </span>
        );
    }
  };

  // Campaign list view
  if (!campaignId) {
    return (
      <AppLayout title="Payout Management">
        <div className="page-enter">
          <p className="text-muted-foreground mb-6">Select a campaign to view payout details</p>

          {campaignsLoading ? (
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
            </div>
          ) : campaigns?.length === 0 ? (
            <div className="p-8 rounded-2xl bg-card/50 border border-border/30 text-center text-muted-foreground">
              No campaigns found
            </div>
          ) : (
            <div className="space-y-3 stagger-enter">
              {campaigns?.map((campaign) => (
                <Link
                  key={campaign.id}
                  to={`/admin/payouts/campaign/${campaign.id}`}
                  className="flex items-center justify-between p-5 rounded-2xl bg-card/50 border border-border/30 hover:border-primary/15 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    {campaign.image_url ? (
                      <img src={campaign.image_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-primary glow-primary-sm flex items-center justify-center text-lg font-bold text-primary-foreground">
                        {campaign.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-display font-bold">{campaign.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        ${Number(campaign.spent_budget).toFixed(0)} / ${Number(campaign.total_budget).toFixed(0)} spent
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-lg text-xs capitalize backdrop-blur-sm ${
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
        </div>
      </AppLayout>
    );
  }

  // Campaign participants view
  const selectedCampaign = campaigns?.find((c) => c.id === campaignId);

  return (
    <AppLayout title={selectedCampaign?.name || "Campaign Payouts"}>
      <div className="page-enter">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/admin/payouts" className="hover:text-foreground transition-colors">Campaigns</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-display">{selectedCampaign?.name}</span>
        </div>

        {participantsLoading ? (
          <div className="space-y-4">
            {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
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
                to={`/admin/payouts/campaign/${campaignId}/user/${participant.creator_id}`}
                className="block p-5 rounded-2xl bg-card/50 border border-border/30 hover:border-primary/15 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-primary glow-primary-sm flex items-center justify-center text-base sm:text-lg font-bold text-primary-foreground overflow-hidden">
                        {participant.avatar_url ? (
                          <img src={participant.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          participant.full_name?.charAt(0) || "?"
                        )}
                      </div>
                      {participant.is_banned && (
                        <div className="absolute -bottom-1 -right-1 bg-destructive rounded-full p-0.5">
                          <Ban className="h-3 w-3 text-destructive-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display font-bold truncate">{participant.full_name || "Anonymous"}</h3>
                        {!participant.payment_verified && (
                          <Badge variant="outline" className="text-yellow-500 border-yellow-500/30 text-xs">
                            Unverified
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{participant.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getPayoutStatusBadge(participant.payout_status)}
                    <ChevronRight className="h-5 w-5 text-muted-foreground hidden sm:block" />
                  </div>
                </div>

                {/* Clip Stats Row */}
                <div className="mt-4 pt-4 border-t border-border/30 flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/30">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Clips:</span>
                    <span className="font-medium text-emerald-400">{participant.approved_count || 0}</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="font-medium text-destructive">{participant.rejected_count || 0}</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="font-medium text-yellow-400">{participant.pending_count || 0}</span>
                    <span className="text-xs text-muted-foreground">(A/R/P)</span>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/30">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Views:</span>
                    <span className="font-medium">{formatNumber(participant.total_views)}</span>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">Earnings:</span>
                    <span className="font-display font-bold text-primary">${participant.total_earnings.toFixed(2)}</span>
                  </div>

                  {participant.payout_method && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/30">
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Payment:</span>
                      <span className="font-medium capitalize">{participant.payout_method}</span>
                    </div>
                  )}

                  {!participant.payment_verified && (
                    <div className="flex items-center justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl border-border/30"
                        onClick={(e) => {
                          e.preventDefault();
                          handleVerifyPayment(participant.creator_id);
                        }}
                      >
                        <Shield className="h-4 w-4 mr-1" />
                        Verify Payment
                      </Button>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AdminCampaignPayouts;
