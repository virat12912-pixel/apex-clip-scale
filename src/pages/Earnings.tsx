import { useMemo } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { DollarSign, TrendingUp, Clock, Eye, AlertCircle, ChevronRight, CheckCircle, XCircle, Film, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet, usePayouts, useRequestPayout } from "@/hooks/useWallet";
import { useMySubmissions } from "@/hooks/useSubmissions";
import { useMyFinalSubmissions } from "@/hooks/useFinalSubmissions";
import { FinalSubmissionTimeline } from "@/components/campaigns/FinalSubmissionTimeline";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { ElevatedCard, ElevatedCardContent, ElevatedCardHeader, ElevatedCardTitle } from "@/components/ui/elevated-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionDivider } from "@/components/ui/section-divider";

interface CampaignEarnings {
  campaign_id: string;
  campaign_name: string;
  campaign_status: string;
  approved_count: number;
  rejected_count: number;
  pending_count: number;
  total_views: number;
  total_earnings: number;
  min_payout_views: number;
  is_eligible: boolean;
}

const Earnings = () => {
  const { data: wallet, isLoading: walletLoading } = useWallet();
  const { data: payouts, isLoading: payoutsLoading } = usePayouts();
  const { data: submissions, isLoading: submissionsLoading } = useMySubmissions();
  const { data: finalSubmissions } = useMyFinalSubmissions();
  const { profile } = useAuth();
  const requestPayout = useRequestPayout();
  const { toast } = useToast();

  const campaignEarnings = useMemo(() => {
    if (!submissions && !finalSubmissions) return [];
    const grouped = new Map<string, CampaignEarnings>();

    // Build from regular submissions
    (submissions || []).forEach((sub: any) => {
      const campaignId = sub.campaign_id;
      const campaignName = sub.campaign?.name || "Unknown Campaign";
      const campaignStatus = sub.campaign?.status || "active";
      if (!grouped.has(campaignId)) {
        grouped.set(campaignId, { campaign_id: campaignId, campaign_name: campaignName, campaign_status: campaignStatus, approved_count: 0, rejected_count: 0, pending_count: 0, total_views: 0, total_earnings: 0, min_payout_views: 1000, is_eligible: false });
      }
      const entry = grouped.get(campaignId)!;
      if (sub.status === "approved" || sub.status === "paid") {
        entry.approved_count += 1;
        entry.total_views += Number(sub.views || 0);
        entry.total_earnings += Number(sub.earnings || 0);
      } else if (sub.status === "rejected") { entry.rejected_count += 1; }
      else if (sub.status === "pending") {
        entry.pending_count += 1;
        entry.total_views += Number(sub.views || 0);
        entry.total_earnings += Number(sub.earnings || 0);
      }
    });

    // Merge final submissions — add campaigns that don't exist from regular submissions
    (finalSubmissions || []).forEach((fs) => {
      if (!grouped.has(fs.campaign_id)) {
        grouped.set(fs.campaign_id, {
          campaign_id: fs.campaign_id,
          campaign_name: fs.campaign?.name || "Unknown Campaign",
          campaign_status: fs.campaign?.status || "completed",
          approved_count: 1, // They must have had approved clips to reach final submission
          rejected_count: 0,
          pending_count: 0,
          total_views: Number(fs.tracked_views || 0),
          total_earnings: Number(fs.final_earnings || 0),
          min_payout_views: 1000,
          is_eligible: false,
        });
      }
    });

    // Override with verified_views/final_earnings when final submission is approved
    grouped.forEach((entry) => {
      const fs = finalSubmissions?.find(f => f.campaign_id === entry.campaign_id);
      if (fs && (fs.status === "approved" || fs.status === "paid") && fs.verified_views != null) {
        entry.total_views = Number(fs.verified_views);
        entry.total_earnings = Number(fs.final_earnings || 0);
      }
      entry.is_eligible = entry.total_earnings >= 10 && entry.approved_count > 0;
    });

    return Array.from(grouped.values()).sort((a, b) => b.total_earnings - a.total_earnings);
  }, [submissions, finalSubmissions]);

  const totalEarnings = campaignEarnings.reduce((sum, c) => sum + c.total_earnings, 0);

  // Available = sum of final_earnings from campaigns where final submission is approved and no payout exists yet
  const availableBalance = useMemo(() => {
    if (!finalSubmissions || !payouts) return 0;
    return finalSubmissions
      .filter(fs => fs.status === "approved" && !payouts.some(p => (p as any).campaign_id === fs.campaign_id && ["pending", "approved", "paid"].includes(p.status)))
      .reduce((sum, fs) => sum + Number(fs.final_earnings || 0), 0);
  }, [finalSubmissions, payouts]);

  const hasPaymentDetails = () => {
    if (!profile) return false;
    if (profile.payout_method === "paypal") return !!profile.payout_email;
    if (profile.payout_method === "usdc_solana") return !!profile.solana_wallet_address;
    return false;
  };

  const hasPendingOrPaidPayoutForCampaign = (campaignId: string) => {
    return payouts?.some(p => 
      (p.status === "pending" || p.status === "approved" || p.status === "paid") && (p as any).campaign_id === campaignId
    );
  };

  const handleRequestPayout = async (campaignId: string, amount: number) => {
    if (requestPayout.isPending) return;
    if (amount < 10) { toast({ title: "Minimum $10 required", variant: "destructive" }); return; }
    if (!hasPaymentDetails()) { toast({ title: "Payment details required", description: "Please add your payment details in your profile before requesting a payout", variant: "destructive" }); return; }
    if (hasPendingOrPaidPayoutForCampaign(campaignId)) { toast({ title: "Payout already exists", description: "You already have a payout request for this campaign", variant: "destructive" }); return; }
    try {
      await requestPayout.mutateAsync({ amount, campaign_id: campaignId });
      toast({ title: "Payout requested" });
    } catch (error: any) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const statCards = [
    { icon: DollarSign, label: "Total Earnings", value: `$${totalEarnings.toFixed(2)}`, bg: "bg-emerald-500/10", text: "text-emerald-400" },
    { icon: Clock, label: "Available", value: `$${availableBalance.toFixed(2)}`, bg: "bg-yellow-500/10", text: "text-yellow-400" },
    { icon: Clock, label: "Processing", value: `$${(wallet?.locked_earnings || 0).toFixed(2)}`, bg: "bg-orange-500/10", text: "text-orange-400" },
  ];

  return (
    <AppLayout title="Earnings">
      <div className="page-enter">
        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 stagger-enter">
          {walletLoading ? Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />) : (
            statCards.map((stat) => (
              <div key={stat.label} className="p-5 rounded-2xl bg-card/50 border border-border/30 transition-all duration-300 hover:border-primary/15 hover:-translate-y-0.5 hover:shadow-lg group">
                <div className={`p-2.5 rounded-xl ${stat.bg} w-fit mb-3 transition-transform duration-300 group-hover:scale-110`}>
                  <stat.icon className={`h-5 w-5 ${stat.text}`} />
                </div>
                <div className="text-2xl font-display font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground/60">{stat.label}</div>
              </div>
            ))
          )}
        </div>

        {/* Payment details warning */}
        {!hasPaymentDetails() && (
          <div className="p-4 rounded-xl bg-yellow-500/8 border border-yellow-500/15 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-yellow-500">Payment details required</p>
                <p className="text-xs text-muted-foreground/50 mt-1">Add your payment details before requesting payouts.</p>
                <Button asChild size="sm" variant="outline" className="mt-3 rounded-lg border-yellow-500/20 hover:bg-yellow-500/10">
                  <Link to="/profile">Update Profile</Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* My Campaigns Section */}
          <div className="lg:col-span-2 space-y-6">
            <ElevatedCard variant="elevated" className="rounded-2xl">
              <ElevatedCardHeader>
                <ElevatedCardTitle className="flex items-center gap-2 section-header font-display">
                  <Film className="h-5 w-5 text-primary" />
                  My Campaigns
                </ElevatedCardTitle>
              </ElevatedCardHeader>
              <ElevatedCardContent>
                {submissionsLoading ? (
                  <div className="space-y-4">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
                ) : campaignEarnings.length === 0 ? (
                  <EmptyState icon={Film} title="No campaigns joined yet" description="Start earning by joining a campaign and submitting clips" variant="gradient" action={{ label: "Browse Campaigns", onClick: () => window.location.href = "/campaigns" }} />
                ) : (
                  <div className="space-y-3 stagger-enter">
                    {campaignEarnings.map((campaign) => {
                      const rawFs = finalSubmissions?.find(f => f.campaign_id === campaign.campaign_id);
                      const isCampaignLive = campaign.campaign_status === "active" || campaign.campaign_status === "paused" || campaign.campaign_status === "private";
                      const isCampaignCompleted = campaign.campaign_status === "completed";

                      // Detect if campaign was relaunched after a previous paid cycle
                      // Check if there are submissions created after the final submission was paid
                      const isRelaunchedAfterPaid = (() => {
                        if (!rawFs || rawFs.status !== "paid" || !rawFs.paid_at) return false;
                        const paidAt = new Date(rawFs.paid_at).getTime();
                        const campaignSubs = (submissions || []).filter((s: any) => s.campaign_id === campaign.campaign_id);
                        return campaignSubs.some((s: any) => new Date(s.created_at).getTime() > paidAt);
                      })();

                      // If campaign was reactivated and payout was already made, treat as fresh start
                      const isRelaunchedAndPaid = (isCampaignLive || isRelaunchedAfterPaid) && rawFs?.status === "paid";
                      const fs = isRelaunchedAndPaid ? undefined : rawFs;
                      const fsStatus = fs?.status;

                      // Skip old paid payouts when campaign is relaunched (exclude payouts from before the relaunch)
                      const excludePayoutsBefore = isRelaunchedAndPaid && rawFs?.paid_at ? new Date(rawFs.paid_at) : undefined;
                      const hasPending = isRelaunchedAndPaid ? false : hasPendingOrPaidPayoutForCampaign(campaign.campaign_id, excludePayoutsBefore);

                      const isFinalApproved = fsStatus === "approved";
                      const isFinalPaid = fsStatus === "paid";
                      const canRequestPayout = isFinalApproved && campaign.total_earnings >= 10 && hasPaymentDetails() && !hasPending;
                      const statusLabel = isRelaunchedAndPaid ? "Posting" : !fs ? "Posting" : fsStatus === "submitted" ? "Under Review" : fsStatus === "approved" ? "Approved" : fsStatus === "paid" ? "Paid" : fsStatus === "rejected" ? "Rejected" : "Posting";
                      const statusColor = isRelaunchedAndPaid ? "bg-blue-500/10 text-blue-400" : !fs ? "bg-blue-500/10 text-blue-400" : fsStatus === "submitted" || fsStatus === "under_review" ? "bg-yellow-500/10 text-yellow-400" : fsStatus === "approved" ? "bg-emerald-500/10 text-emerald-400" : fsStatus === "paid" ? "bg-primary/10 text-primary" : "bg-red-500/10 text-red-400";

                      // Determine payout button state
                      let payoutButtonLabel = "Request Payout";
                      let payoutButtonDisabled = true;
                      let payoutTooltip = "";

                      if (hasPending) {
                        const existingPayout = payouts?.find(p => (p as any).campaign_id === campaign.campaign_id);
                        const isPaid = existingPayout?.status === "paid";
                        const isPending = existingPayout?.status === "pending" || existingPayout?.status === "approved";
                        payoutButtonLabel = isPaid ? "Paid" : isPending ? "Payout Pending" : "Payout Exists";
                        payoutButtonDisabled = true;
                      } else if (isFinalPaid) {
                        payoutButtonLabel = "Paid";
                        payoutButtonDisabled = true;
                      } else if (isCampaignLive) {
                        payoutButtonLabel = "Request Payout";
                        payoutButtonDisabled = true;
                        payoutTooltip = "This campaign is still live. Wait for it to complete before requesting a payout.";
                      } else if (isCampaignCompleted && !isFinalApproved) {
                        payoutButtonLabel = "Verify Demographics";
                        payoutButtonDisabled = false;
                        payoutTooltip = "Verify your demographics to request a payout.";
                      } else if (canRequestPayout) {
                        payoutButtonLabel = "Request Payout";
                        payoutButtonDisabled = false;
                      }

                      const handlePayoutClick = () => {
                        if (hasPending || isFinalPaid) return;
                        if (isCampaignLive) {
                          toast({ title: "Campaign Still Live", description: "This campaign is still live. Please wait for it to complete before requesting a payout.", variant: "destructive" });
                          return;
                        }
                        if (isCampaignCompleted && !isFinalApproved) {
                          window.location.href = `/campaigns/${campaign.campaign_id}`;
                          return;
                        }
                        if (canRequestPayout) {
                          handleRequestPayout(campaign.campaign_id, campaign.total_earnings);
                        }
                      };

                      return (
                        <div key={campaign.campaign_id} className="p-4 rounded-xl bg-secondary/20 border border-border/20 hover:border-primary/15 transition-all duration-300 group">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-display font-bold group-hover:text-primary transition-colors duration-200">{campaign.campaign_name}</h4>
                              <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground/60">
                                <span className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-emerald-400" />{isRelaunchedAndPaid ? 0 : campaign.approved_count} approved</span>
                                {(isRelaunchedAndPaid ? false : campaign.rejected_count > 0) && <span className="flex items-center gap-1"><XCircle className="h-3.5 w-3.5 text-red-400" />{campaign.rejected_count} rejected</span>}
                                {(isRelaunchedAndPaid ? false : campaign.pending_count > 0) && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-yellow-400" />{campaign.pending_count} pending</span>}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-display font-bold text-primary">${isRelaunchedAndPaid ? "0.00" : campaign.total_earnings.toFixed(2)}</div>
                              <div className="text-xs text-muted-foreground/40">{isRelaunchedAndPaid ? "0" : formatNumber(campaign.total_views)} views</div>
                            </div>
                          </div>

                          {/* Tracked vs Verified views - hidden when relaunched after payout */}
                          {!isRelaunchedAndPaid && (
                            <div className="grid grid-cols-2 gap-2 mb-3">
                              <div className="p-2 rounded-lg bg-secondary/30 border border-border/10">
                                <div className="text-[10px] text-muted-foreground/40">Tracked Views</div>
                                <div className="text-sm font-bold">{formatNumber(fs ? fs.tracked_views : campaign.total_views)}</div>
                              </div>
                              <div className="p-2 rounded-lg bg-secondary/30 border border-border/10">
                                <div className="text-[10px] text-muted-foreground/40">Verified Views</div>
                                <div className="text-sm font-bold">{fs && fs.verified_views != null ? formatNumber(fs.verified_views) : "Pending"}</div>
                              </div>
                            </div>
                          )}



                          {fs && <FinalSubmissionTimeline status={fs.status} />}

                          {/* Payout Button - Central */}
                          <div className="my-3">
                            <Button
                              size="sm"
                              onClick={handlePayoutClick}
                              disabled={requestPayout.isPending || payoutButtonDisabled}
                              className={`w-full rounded-lg font-display font-bold h-10 text-sm ${
                                canRequestPayout && !requestPayout.isPending
                                  ? "bg-gradient-primary hover:opacity-90"
                                  : isCampaignCompleted && !isFinalApproved && !isFinalPaid
                                  ? "bg-primary/80 hover:bg-primary text-primary-foreground"
                                  : hasPending || isFinalPaid || requestPayout.isPending
                                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {isCampaignLive && <Lock className="h-3.5 w-3.5 mr-1.5" />}
                              {hasPending && <Lock className="h-3.5 w-3.5 mr-1.5" />}
                              {isCampaignCompleted && !isFinalApproved && !isFinalPaid && !hasPending && <Eye className="h-3.5 w-3.5 mr-1.5" />}
                              {canRequestPayout && !requestPayout.isPending && <DollarSign className="h-3.5 w-3.5 mr-1.5" />}
                              {requestPayout.isPending && canRequestPayout ? "Requesting..." : payoutButtonLabel}
                            </Button>
                            {payoutTooltip && !canRequestPayout && !hasPending && !isFinalPaid && (
                              <p className="text-[10px] text-muted-foreground/50 text-center mt-1.5">{payoutTooltip}</p>
                            )}
                          </div>

                          <SectionDivider variant="line" size="sm" />
                          <div className="flex items-center justify-between">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusColor}`}>
                              {statusLabel}
                            </span>
                            <Link to={`/campaigns/${campaign.campaign_id}`} className="text-sm text-primary/70 hover:text-primary flex items-center gap-1 group/link transition-colors duration-200">
                              View <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover/link:translate-x-0.5" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ElevatedCardContent>
            </ElevatedCard>
          </div>

          {/* Payout History Section */}
          <div className="space-y-6">
            {payouts && payouts.length > 0 && (
              <ElevatedCard variant="spotlight" className="rounded-2xl">
                <ElevatedCardHeader>
                  <ElevatedCardTitle className="font-display">Recent Payouts</ElevatedCardTitle>
                </ElevatedCardHeader>
                <ElevatedCardContent className="space-y-2">
                  {payouts.slice(0, 5).map((payout) => (
                    <div key={payout.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 hover:bg-secondary/30 transition-all duration-200">
                      <div>
                        <p className="font-display font-bold">${Number(payout.amount).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground/40">{new Date(payout.created_at).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize ${
                        payout.status === "paid" ? "bg-emerald-500/10 text-emerald-400" :
                        payout.status === "approved" ? "bg-blue-500/10 text-blue-400" :
                        payout.status === "pending" ? "bg-yellow-500/10 text-yellow-400" :
                        "bg-red-500/10 text-red-400"
                      }`}>
                        {payout.status}
                      </span>
                    </div>
                  ))}
                </ElevatedCardContent>
              </ElevatedCard>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Earnings;
