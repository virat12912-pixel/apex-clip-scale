import { AppLayout } from "@/components/app/AppLayout";
import { useAdminStats } from "@/hooks/useStats";
import { useAllSubmissions } from "@/hooks/useSubmissions";
import { useAllBrandApplications } from "@/hooks/useBrandApplications";
import { usePlatformAnalytics } from "@/hooks/useCampaignAnalytics";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  DollarSign, 
  Eye, 
  Film, 
  Users, 
  Clock, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Building2,
  Wallet,
  ArrowRight,
  Activity,
  Download,
  RefreshCw,
  ShieldCheck
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExecutiveKPICard } from "@/components/dashboard/ExecutiveKPICard";
import { ViewsChart } from "@/components/dashboard/ViewsChart";
import { CampaignHealthBadge } from "@/components/dashboard/CampaignHealthBadge";
import { downloadCSV, generatePlatformAnalyticsCSV } from "@/lib/exportUtils";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const useAllPayouts = () => {
  return useQuery({
    queryKey: ["all-payouts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payouts")
        .select(`*, profiles:user_id (full_name, email)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

const useAllWallets = () => {
  return useQuery({
    queryKey: ["all-wallets"],
    queryFn: async () => {
      const { data, error } = await supabase.from("wallets").select("*");
      if (error) throw error;
      return data;
    },
  });
};

const useAllCampaigns = () => {
  return useQuery({
    queryKey: ["all-campaigns-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

const AdminDashboard = () => {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: submissions, isLoading: submissionsLoading } = useAllSubmissions();
  const { data: brandApps, isLoading: brandsLoading } = useAllBrandApplications();
  const { data: payouts, isLoading: payoutsLoading } = useAllPayouts();
  const { data: wallets, isLoading: walletsLoading } = useAllWallets();
  const { data: campaigns, isLoading: campaignsLoading } = useAllCampaigns();
  const { data: analyticsData } = usePlatformAnalytics(30);

  const isLoading = statsLoading || submissionsLoading || brandsLoading || payoutsLoading || walletsLoading;

  const pendingPayouts = payouts?.filter(p => p.status === "pending") || [];
  const totalPendingPayoutAmount = pendingPayouts.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPaidOut = payouts?.filter(p => p.status === "paid").reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const totalOwedToCreators = wallets?.reduce((sum, w) => sum + Number(w.pending_balance), 0) || 0;

  const pendingSubmissions = submissions?.filter(s => s.status === "pending") || [];
  const approvedSubmissions = submissions?.filter(s => s.status === "approved" || s.status === "paid") || [];
  const totalEarningsGenerated = submissions?.reduce((sum, s) => sum + Number(s.earnings), 0) || 0;
  const totalViews = submissions?.reduce((sum, s) => sum + (s.views || 0), 0) || 0;

  const pendingBrandApps = brandApps?.filter(a => a.status === "pending") || [];

  const healthyCampaigns = campaigns?.filter(c => (c as any).health_status === "healthy" && c.status === "active").length || 0;
  const needsAttentionCampaigns = campaigns?.filter(c => (c as any).health_status === "needs_attention" && c.status === "active").length || 0;
  const underperformingCampaigns = campaigns?.filter(c => (c as any).health_status === "underperforming" && c.status === "active").length || 0;

  const handleRefreshViews = async () => {
    setIsRefreshing(true);
    try {
      const { error } = await supabase.functions.invoke("update-all-views");
      if (error) throw error;
      toast({ title: "Views Refreshed", description: "All submission views have been updated from platform APIs." });
    } catch (error) {
      console.error("Refresh error:", error);
      toast({ title: "Refresh Failed", description: "Unable to refresh views. Please try again.", variant: "destructive" });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExportAnalytics = () => {
    if (!analyticsData) return;
    const exportData = analyticsData.map(d => ({
      date: d.date,
      totalViews: d.views,
      totalEarnings: d.earnings,
      newSubmissions: d.submissions,
      activeCampaigns: stats?.activeCampaigns || 0,
      pendingPayouts: totalPendingPayoutAmount
    }));
    const csv = generatePlatformAnalyticsCSV(exportData);
    downloadCSV(csv, `platform_analytics_${new Date().toISOString().split('T')[0]}.csv`);
    toast({ title: "Export Complete", description: "Platform analytics report downloaded." });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  return (
    <AppLayout title="Platform Admin">
      <div className="page-enter">
        {/* Header Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-display font-bold">Platform Overview</h2>
            <p className="text-muted-foreground">Monitor platform health, finances, and operations</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefreshViews}
              disabled={isRefreshing}
              className="rounded-xl border-border/30 hover:border-primary/30"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh All Views
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportAnalytics}
              disabled={!analyticsData}
              className="rounded-xl border-border/30 hover:border-primary/30"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Analytics
            </Button>
          </div>
        </div>

        {/* Executive KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-enter">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)
          ) : (
            <>
              <ExecutiveKPICard 
                icon={DollarSign}
                label="Total Platform Revenue"
                value={`$${totalEarningsGenerated.toFixed(2)}`}
                subValue={`$${totalPaidOut.toFixed(2)} paid out`}
                variant="success"
              />
              <ExecutiveKPICard 
                icon={Eye}
                label="Total Views Generated"
                value={formatNumber(totalViews)}
                trend={{ value: "12.3%", positive: true }}
                variant="primary"
              />
              <ExecutiveKPICard 
                icon={Wallet}
                label="Pending Payouts"
                value={`$${totalPendingPayoutAmount.toFixed(2)}`}
                subValue={`${pendingPayouts.length} requests awaiting approval`}
                variant="warning"
              />
              <ExecutiveKPICard 
                icon={Activity}
                label="Active Campaigns"
                value={stats?.activeCampaigns?.toString() || "0"}
                subValue={`${stats?.totalCampaigns || 0} total campaigns`}
                variant="default"
              />
            </>
          )}
        </div>

        {/* Campaign Health Overview */}
        <div className="mb-8">
          <h3 className="text-lg font-display font-bold mb-4">Campaign Health</h3>
          <div className="grid sm:grid-cols-3 gap-4 stagger-enter">
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                <span className="text-2xl font-display font-bold">{healthyCampaigns}</span>
              </div>
              <p className="text-sm text-muted-foreground">Healthy Campaigns</p>
            </div>
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="h-5 w-5 text-amber-400" />
                <span className="text-2xl font-display font-bold">{needsAttentionCampaigns}</span>
              </div>
              <p className="text-sm text-muted-foreground">Need Attention</p>
            </div>
            <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <span className="text-2xl font-display font-bold">{underperformingCampaigns}</span>
              </div>
              <p className="text-sm text-muted-foreground">Underperforming</p>
            </div>
          </div>
        </div>

        {/* Platform Analytics Chart */}
        {analyticsData && analyticsData.length > 0 && (
          <div className="mb-8">
            <ViewsChart 
              data={analyticsData} 
              title="Platform Performance (Last 30 Days)"
              showEarnings={true}
            />
          </div>
        )}

        {/* Operational Stats */}
        <div className="mb-8">
          <h3 className="text-lg font-display font-bold mb-4">Operational Metrics</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-enter">
            <StatCard icon={Film} label="Pending Submissions" value={pendingSubmissions.length.toString()} variant={pendingSubmissions.length > 0 ? "warning" : "default"} />
            <StatCard icon={Building2} label="Pending Brand Apps" value={pendingBrandApps.length.toString()} variant={pendingBrandApps.length > 0 ? "warning" : "default"} />
            <StatCard icon={ShieldCheck} label="Approved Clips" value={approvedSubmissions.length.toString()} variant="success" />
            <StatCard icon={Users} label="Total Submissions" value={submissions?.length?.toString() || "0"} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-enter">
          <QuickActionCard to="/admin/submissions" title="Review Submissions" description={`${pendingSubmissions.length} pending`} icon={Film} highlight={pendingSubmissions.length > 0} />
          <QuickActionCard to="/admin/payouts" title="Manage Payouts" description={`${pendingPayouts.length} requests`} icon={Wallet} highlight={pendingPayouts.length > 0} />
          <QuickActionCard to="/admin/brands" title="Brand Applications" description={`${pendingBrandApps.length} waiting`} icon={Building2} highlight={pendingBrandApps.length > 0} />
          <QuickActionCard to="/admin/social-accounts" title="Verify Accounts" description="Review clipper accounts" icon={ShieldCheck} />
        </div>

        {/* Recent Activity */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-card/50 border border-border/30">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-bold">Recent Submissions</h3>
              <Link to="/admin/submissions" className="text-sm text-primary hover:underline">View all</Link>
            </div>
            <div className="space-y-3">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)
              ) : pendingSubmissions.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">All caught up!</p>
                </div>
              ) : (
                pendingSubmissions.slice(0, 5).map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <div>
                        <p className="text-sm font-medium">{sub.creator_profile?.full_name || "Creator"}</p>
                        <p className="text-xs text-muted-foreground">{sub.campaign?.name}</p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 backdrop-blur-sm">Pending</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-card/50 border border-border/30">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-bold">Pending Payouts</h3>
              <Link to="/admin/payouts" className="text-sm text-primary hover:underline">View all</Link>
            </div>
            <div className="space-y-3">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)
              ) : pendingPayouts.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No pending payouts</p>
                </div>
              ) : (
                pendingPayouts.slice(0, 5).map((payout) => (
                  <div key={payout.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <div>
                        <p className="text-sm font-medium">{payout.profiles?.full_name || "Creator"}</p>
                        <p className="text-xs text-muted-foreground">{payout.payout_method}</p>
                      </div>
                    </div>
                    <span className="font-display font-bold text-primary">${Number(payout.amount).toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  sublabel,
  variant = "default" 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string;
  sublabel?: string;
  variant?: "default" | "success" | "warning";
}) {
  const iconBg = {
    default: "bg-primary/10",
    success: "bg-emerald-500/10",
    warning: "bg-amber-500/10",
  }[variant];

  const iconColor = {
    default: "text-primary",
    success: "text-emerald-400",
    warning: "text-amber-400",
  }[variant];

  return (
    <div className="group p-5 rounded-2xl bg-card/50 border border-border/30 hover:border-primary/15 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">
      <div className={`p-2 rounded-xl ${iconBg} w-fit mb-3`}>
        <Icon className={`h-5 w-5 ${iconColor} group-hover:scale-110 transition-all duration-300`} />
      </div>
      <div className="text-2xl font-display font-bold mb-1">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
      {sublabel && <div className="text-xs text-muted-foreground mt-1">{sublabel}</div>}
    </div>
  );
}

function QuickActionCard({
  to,
  title,
  description,
  icon: Icon,
  highlight = false,
}: {
  to: string;
  title: string;
  description: string;
  icon: React.ElementType;
  highlight?: boolean;
}) {
  return (
    <Link 
      to={to} 
      className={`group p-5 rounded-2xl bg-card/50 border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg flex items-center justify-between ${
        highlight ? "border-amber-500/50 hover:border-amber-500 hover:shadow-amber-500/10" : "border-border/30 hover:border-primary/30"
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${highlight ? "bg-amber-500/10" : "bg-gradient-primary glow-primary-sm"}`}>
          <Icon className={`h-5 w-5 ${highlight ? "text-amber-400" : "text-primary-foreground"} group-hover:scale-110 transition-all duration-300`} />
        </div>
        <div>
          <h3 className="font-display font-bold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <ArrowRight className="h-5 w-5 text-muted-foreground" />
    </Link>
  );
}

export default AdminDashboard;
