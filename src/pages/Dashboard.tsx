import { AppLayout } from "@/components/app/AppLayout";
import { 
  DollarSign, 
  Eye, 
  Film, 
  TrendingUp, 
  ArrowUpRight,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCreatorStats, useBrandStats } from "@/hooks/useStats";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useMySubmissions } from "@/hooks/useSubmissions";
import { useCreatorAnalytics } from "@/hooks/useCampaignAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { ExecutiveKPICard } from "@/components/dashboard/ExecutiveKPICard";
import { ViewsChart } from "@/components/dashboard/ViewsChart";
import { ClipperTierBadge } from "@/components/dashboard/ClipperTierBadge";
import { CampaignHealthBadge } from "@/components/dashboard/CampaignHealthBadge";
import { CampaignExportButton } from "@/components/campaigns/CampaignExportButton";

const Dashboard = () => {
  const { profile, role } = useAuth();
  const { data: creatorStats, isLoading: creatorLoading } = useCreatorStats();
  const { data: brandStats, isLoading: brandLoading } = useBrandStats();
  const { data: campaigns, isLoading: campaignsLoading } = useCampaigns({ status: "active" });
  const { data: submissions, isLoading: submissionsLoading } = useMySubmissions();
  const { data: analyticsData } = useCreatorAnalytics(30);

  const isLoading = role === "creator" ? creatorLoading : brandLoading;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const recentSubmissions = submissions?.slice(0, 4) || [];
  const activeCampaigns = campaigns?.slice(0, 3) || [];

  // Calculate CPV for brands
  const cpv = brandStats?.totalViews && brandStats.totalViews > 0 
    ? (brandStats.spentBudget / brandStats.totalViews * 1000).toFixed(2)
    : "0.00";

  return (
    <AppLayout title="Dashboard">
      {/* Welcome banner */}
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold">
              Welcome back, {profile?.full_name?.split(" ")[0] || "there"}!
            </h2>
            {role === "creator" && (
              <ClipperTierBadge tier={(profile as any)?.clipper_tier || "standard"} size="sm" />
            )}
          </div>
          <p className="text-muted-foreground mb-4">
            {role === "creator" 
              ? `You have ${submissions?.filter(s => s.status === "pending").length || 0} pending submissions.`
              : `You have ${campaigns?.length || 0} active campaigns running.`
            }
          </p>
          <div className="flex gap-3">
            <Button asChild className="bg-gradient-primary hover:opacity-90 glow-primary-sm">
              <Link to="/campaigns">
                Browse Campaigns
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            {(role === "brand" || role === "admin") && (
              <Button variant="outline" asChild>
                <Link to="/launch">Launch Campaign</Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Executive KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))
        ) : role === "creator" ? (
          <>
            <ExecutiveKPICard 
              icon={DollarSign}
              label="Total Earnings"
              value={`$${(creatorStats?.totalEarnings || 0).toFixed(2)}`}
              subValue={`$${(creatorStats?.pendingBalance || 0).toFixed(2)} pending`}
              trend={{ value: "12.5%", positive: true }}
              variant="success"
            />
            <ExecutiveKPICard 
              icon={Eye}
              label="Total Views"
              value={formatNumber(creatorStats?.totalViews || 0)}
              trend={{ value: "8.2%", positive: true }}
              variant="primary"
            />
            <ExecutiveKPICard 
              icon={Film}
              label="Clips Submitted"
              value={creatorStats?.totalClips?.toString() || "0"}
              subValue={`${creatorStats?.approvedClips || 0} approved`}
              variant="default"
            />
            <ExecutiveKPICard 
              icon={Target}
              label="Approval Rate"
              value={`${creatorStats?.totalClips ? ((creatorStats?.approvedClips || 0) / creatorStats.totalClips * 100).toFixed(0) : 0}%`}
              variant="default"
            />
          </>
        ) : (
          <>
            <ExecutiveKPICard 
              icon={Activity}
              label="Active Campaigns"
              value={brandStats?.activeCampaigns?.toString() || "0"}
              subValue={`${brandStats?.totalCampaigns || 0} total campaigns`}
              variant="primary"
            />
            <ExecutiveKPICard 
              icon={DollarSign}
              label="Total Spent"
              value={`$${(brandStats?.spentBudget || 0).toFixed(2)}`}
              subValue={`$${(brandStats?.totalBudget || 0).toFixed(0)} total budget`}
              variant="warning"
            />
            <ExecutiveKPICard 
              icon={Eye}
              label="Total Views"
              value={formatNumber(brandStats?.totalViews || 0)}
              trend={{ value: "15.3%", positive: true }}
              variant="success"
            />
            <ExecutiveKPICard 
              icon={TrendingUp}
              label="CPV (Cost per 1K Views)"
              value={`$${cpv}`}
              variant="default"
            />
          </>
        )}
      </div>

      {/* Analytics Chart - Show for creators */}
      {role === "creator" && analyticsData && analyticsData.length > 0 && (
        <div className="mb-8">
          <ViewsChart 
            data={analyticsData} 
            title="Your Performance (Last 30 Days)"
            showEarnings={true}
          />
        </div>
      )}

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Active campaigns */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">
              {role === "creator" ? "Available Campaigns" : "Your Campaigns"}
            </h3>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/campaigns" className="text-primary">
                View all
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {campaignsLoading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-lg" />
              ))}
            </div>
          ) : activeCampaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No active campaigns</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors border border-transparent hover:border-primary/20"
                >
                  <div className="flex items-start justify-between mb-3">
                    <Link to={`/campaigns/${campaign.id}`} className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{campaign.name}</h4>
                        {(campaign as any).health_status && (
                          <CampaignHealthBadge status={(campaign as any).health_status} size="sm" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        ${campaign.rate_value} per {formatNumber(campaign.rate_unit)} views
                      </p>
                    </Link>
                    <div className="flex items-center gap-2">
                      {role !== "creator" && (
                        <CampaignExportButton 
                          campaignId={campaign.id} 
                          campaignName={campaign.name}
                          variant="ghost"
                          size="sm"
                        />
                      )}
                      <div className="text-right">
                        <div className="font-semibold text-primary">
                          ${Number(campaign.total_budget).toFixed(0)}
                        </div>
                        <div className="text-xs text-muted-foreground">budget</div>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="relative h-2 bg-background rounded-full overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 bg-gradient-primary rounded-full transition-all"
                      style={{ width: `${Math.min((Number(campaign.spent_budget) / Number(campaign.total_budget)) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground text-right">
                    ${Number(campaign.spent_budget).toFixed(0)} spent ({((Number(campaign.spent_budget) / Number(campaign.total_budget)) * 100).toFixed(0)}%)
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="p-6 rounded-xl bg-card border border-border">
          <h3 className="text-lg font-semibold mb-6">Recent Activity</h3>

          {submissionsLoading ? (
            <div className="space-y-4">
              {Array(4).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : recentSubmissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Film className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No submissions yet</p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link to="/campaigns">Browse Campaigns</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentSubmissions.map((submission) => (
                <div key={submission.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <div className={`p-2 rounded-lg ${
                    submission.status === "approved" || submission.status === "paid"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : submission.status === "rejected"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-primary/10 text-primary"
                  }`}>
                    {submission.status === "approved" || submission.status === "paid" ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : submission.status === "rejected" ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <Clock className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm capitalize">{submission.status}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {submission.campaign?.name || "Campaign"}
                    </p>
                  </div>
                  <div className="text-right">
                    {(submission.status === "approved" || submission.status === "paid") && (
                      <p className="text-sm font-medium text-emerald-400">
                        +${Number(submission.earnings).toFixed(2)}
                      </p>
                    )}
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(submission.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
