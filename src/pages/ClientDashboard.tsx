import { AppLayout } from "@/components/app/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useMyAssignedCampaigns } from "@/hooks/useCampaignAssignments";
import { useCampaignSubmissions } from "@/hooks/useSubmissions";
import { useCampaignAnalytics } from "@/hooks/useCampaignAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { ElevatedCard, ElevatedCardContent, ElevatedCardHeader, ElevatedCardTitle } from "@/components/ui/elevated-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ExecutiveKPICard } from "@/components/dashboard/ExecutiveKPICard";
import { ViewsChart } from "@/components/dashboard/ViewsChart";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Eye, Film, BarChart3, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";

const ClientDashboard = () => {
  const { profile } = useAuth();
  const { data: campaigns, isLoading: campaignsLoading } = useMyAssignedCampaigns();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  const activeCampaignId = selectedCampaignId || campaigns?.[0]?.id || null;

  return (
    <AppLayout title="Client Dashboard">
      {/* Welcome */}
      <div className="relative mb-8 p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-primary/10 overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/8 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 animate-pulse-glow" />
        <div className="relative">
          <h2 className="text-3xl font-display font-bold tracking-tight mb-2">
            Welcome, <span className="text-gradient">{profile?.full_name?.split(" ")[0] || "there"}</span>
          </h2>
          <p className="text-muted-foreground/70 text-lg">
            {campaigns?.length || 0} campaign{(campaigns?.length || 0) !== 1 ? "s" : ""} assigned to your account.
          </p>
        </div>
      </div>

      {campaignsLoading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      ) : !campaigns?.length ? (
        <EmptyState
          icon={AlertCircle}
          title="No campaigns assigned"
          description="Your account hasn't been assigned any campaigns yet. Contact your account manager for setup."
          variant="gradient"
        />
      ) : (
        <>
          {/* Campaign selector if multiple */}
          {campaigns.length > 1 && (
            <div className="flex gap-2 mb-6 flex-wrap">
              {campaigns.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCampaignId(c.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
                    activeCampaignId === c.id
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-card/50 text-muted-foreground border-border/30 hover:bg-card/80"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {activeCampaignId && <CampaignWorkspace campaignId={activeCampaignId} campaigns={campaigns} />}
        </>
      )}
    </AppLayout>
  );
};

function CampaignWorkspace({ campaignId, campaigns }: { campaignId: string; campaigns: any[] }) {
  const campaign = campaigns.find((c: any) => c.id === campaignId);
  const { data: submissions, isLoading: subsLoading } = useCampaignSubmissions(campaignId);
  const { data: analyticsData } = useCampaignAnalytics(campaignId, 30);

  if (!campaign) return null;

  const totalBudget = Number(campaign.total_budget);
  const spentBudget = Number(campaign.spent_budget);
  const remaining = totalBudget - spentBudget;
  const budgetPct = totalBudget > 0 ? (spentBudget / totalBudget) * 100 : 0;

  const totalViews = (submissions || []).reduce((sum: number, s: any) => sum + (s.views || 0), 0);
  const totalClips = submissions?.length || 0;
  const approvedClips = (submissions || []).filter((s: any) => s.status === "approved" || s.status === "paid").length;
  const pendingClips = (submissions || []).filter((s: any) => s.status === "pending").length;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  return (
    <div className="space-y-6">
      {/* Campaign Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-display font-bold">{campaign.name}</h3>
          <Badge variant={campaign.status === "active" ? "default" : "secondary"} className="mt-1 capitalize">
            {campaign.status}
          </Badge>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-enter">
        <ExecutiveKPICard icon={DollarSign} label="Budget Total" value={`$${totalBudget.toFixed(0)}`} subValue={`$${remaining.toFixed(0)} remaining`} variant="primary" />
        <ExecutiveKPICard icon={DollarSign} label="Budget Spent" value={`$${spentBudget.toFixed(2)}`} variant="warning" />
        <ExecutiveKPICard icon={Eye} label="Total Views" value={formatNumber(totalViews)} variant="success" />
        <ExecutiveKPICard icon={Film} label="Clips Posted" value={totalClips.toString()} subValue={`${approvedClips} approved · ${pendingClips} pending`} variant="default" />
      </div>

      {/* Budget Progress */}
      <ElevatedCard variant="elevated" className="rounded-2xl">
        <ElevatedCardHeader>
          <ElevatedCardTitle className="font-display">Budget Progress</ElevatedCardTitle>
        </ElevatedCardHeader>
        <ElevatedCardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Spent: ${spentBudget.toFixed(2)}</span>
              <span className="text-muted-foreground">Total: ${totalBudget.toFixed(0)}</span>
            </div>
            <Progress value={Math.min(budgetPct, 100)} className="h-3" />
            <p className="text-xs text-muted-foreground/60">{budgetPct.toFixed(1)}% of budget used</p>
          </div>
        </ElevatedCardContent>
      </ElevatedCard>

      {/* Performance Chart */}
      {analyticsData && analyticsData.length > 0 && (
        <ViewsChart data={analyticsData} title="Campaign Performance (Last 30 Days)" showEarnings={false} />
      )}

      {/* Clip Feed */}
      <ElevatedCard variant="elevated" className="rounded-2xl">
        <ElevatedCardHeader>
          <ElevatedCardTitle className="font-display flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Clip Feed
          </ElevatedCardTitle>
        </ElevatedCardHeader>
        <ElevatedCardContent>
          {subsLoading ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          ) : !submissions?.length ? (
            <EmptyState icon={Film} title="No clips yet" description="No clips have been submitted to this campaign yet." variant="minimal" />
          ) : (
            <div className="space-y-3">
              {submissions.map((sub: any) => (
                <div key={sub.id} className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 border border-border/20 hover:bg-secondary/50 transition-all">
                  <div className={`p-2 rounded-lg ${
                    sub.status === "approved" || sub.status === "paid"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : sub.status === "rejected"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-primary/10 text-primary"
                  }`}>
                    {sub.status === "approved" || sub.status === "paid" ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : sub.status === "rejected" ? (
                      <XCircle className="h-5 w-5" />
                    ) : (
                      <Clock className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <a href={sub.clip_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-primary truncate block">
                      {sub.clip_url}
                    </a>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground/60">
                      <span className="capitalize">{sub.platform}</span>
                      <span>{new Date(sub.created_at).toLocaleDateString()}</span>
                      {sub.creator_profile?.full_name && <span>by {sub.creator_profile.full_name}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 text-sm font-semibold">
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      {formatNumber(sub.views || 0)}
                    </div>
                    <Badge variant="secondary" className="text-[10px] capitalize mt-1">{sub.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ElevatedCardContent>
      </ElevatedCard>
    </div>
  );
}

export default ClientDashboard;
