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
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCreatorStats, useBrandStats } from "@/hooks/useStats";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useMySubmissions } from "@/hooks/useSubmissions";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const { profile, role } = useAuth();
  const { data: creatorStats, isLoading: creatorLoading } = useCreatorStats();
  const { data: brandStats, isLoading: brandLoading } = useBrandStats();
  const { data: campaigns, isLoading: campaignsLoading } = useCampaigns({ status: "active" });
  const { data: submissions, isLoading: submissionsLoading } = useMySubmissions();

  const isLoading = role === "creator" ? creatorLoading : brandLoading;
  const stats = role === "creator" ? creatorStats : brandStats;

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const recentSubmissions = submissions?.slice(0, 4) || [];
  const activeCampaigns = campaigns?.slice(0, 3) || [];

  return (
    <AppLayout title="Dashboard">
      {/* Welcome banner */}
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
        <h2 className="text-2xl font-bold mb-2">
          Welcome back, {profile?.full_name?.split(" ")[0] || "there"}! 👋
        </h2>
        <p className="text-muted-foreground mb-4">
          {role === "creator" 
            ? `You have ${submissions?.filter(s => s.status === "pending").length || 0} pending submissions.`
            : `You have ${campaigns?.length || 0} active campaigns.`
          }
        </p>
        <div className="flex gap-3">
          <Button asChild className="bg-gradient-primary hover:opacity-90">
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

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))
        ) : role === "creator" ? (
          <>
            <StatCard 
              icon={DollarSign}
              label="Total Earnings"
              value={`$${(creatorStats?.totalEarnings || 0).toFixed(2)}`}
              change="+12.5%"
              positive
            />
            <StatCard 
              icon={Eye}
              label="Total Views"
              value={formatNumber(creatorStats?.totalViews || 0)}
              change="+8.2%"
              positive
            />
            <StatCard 
              icon={Film}
              label="Clips Submitted"
              value={creatorStats?.totalClips?.toString() || "0"}
              change={`${creatorStats?.approvedClips || 0} approved`}
            />
            <StatCard 
              icon={Clock}
              label="Pending Balance"
              value={`$${(creatorStats?.pendingBalance || 0).toFixed(2)}`}
            />
          </>
        ) : (
          <>
            <StatCard 
              icon={TrendingUp}
              label="Active Campaigns"
              value={brandStats?.activeCampaigns?.toString() || "0"}
              change={`${brandStats?.totalCampaigns || 0} total`}
            />
            <StatCard 
              icon={DollarSign}
              label="Total Spent"
              value={`$${(brandStats?.spentBudget || 0).toFixed(2)}`}
              change={`$${(brandStats?.totalBudget || 0).toFixed(0)} budget`}
            />
            <StatCard 
              icon={Eye}
              label="Total Views"
              value={formatNumber(brandStats?.totalViews || 0)}
              change="+8.2%"
              positive
            />
            <StatCard 
              icon={Film}
              label="Submissions"
              value={brandStats?.totalSubmissions?.toString() || "0"}
            />
          </>
        )}
      </div>

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
                <Skeleton key={i} className="h-24 rounded-lg" />
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
                <Link
                  key={campaign.id}
                  to={`/campaigns/${campaign.id}`}
                  className="block p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{campaign.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        ${campaign.rate_value} per {formatNumber(campaign.rate_unit)} views
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-primary">
                        ${Number(campaign.total_budget).toFixed(0)}
                      </div>
                      <div className="text-xs text-muted-foreground">budget</div>
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
                    ${Number(campaign.spent_budget).toFixed(0)} spent
                  </div>
                </Link>
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
                <div key={submission.id} className="flex items-start gap-3">
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
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(submission.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  change, 
  positive 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string; 
  change?: string;
  positive?: boolean;
}) {
  return (
    <div className="p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        {change && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            positive 
              ? "bg-emerald-500/10 text-emerald-400" 
              : "bg-secondary text-muted-foreground"
          }`}>
            {change}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

export default Dashboard;
