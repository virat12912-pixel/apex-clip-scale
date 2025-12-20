import { AppLayout } from "@/components/app/AppLayout";
import { useAdminStats } from "@/hooks/useStats";
import { DollarSign, Eye, Film, Users, Clock, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const AdminDashboard = () => {
  const { data: stats, isLoading } = useAdminStats();

  return (
    <AppLayout title="Admin Dashboard">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32" />)
        ) : (
          <>
            <StatCard icon={TrendingUp} label="Active Campaigns" value={stats?.activeCampaigns?.toString() || "0"} />
            <StatCard icon={DollarSign} label="Platform Spend" value={`$${(stats?.totalPlatformSpend || 0).toFixed(0)}`} />
            <StatCard icon={Film} label="Pending Submissions" value={stats?.pendingSubmissions?.toString() || "0"} />
            <StatCard icon={Clock} label="Pending Payouts" value={`$${(stats?.pendingPayouts || 0).toFixed(0)}`} />
          </>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Link to="/admin/submissions" className="p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors">
          <h3 className="text-lg font-semibold mb-2">Review Submissions</h3>
          <p className="text-muted-foreground mb-4">Approve or reject creator clip submissions</p>
          <Button className="bg-gradient-primary">View Submissions</Button>
        </Link>
        <Link to="/admin/payouts" className="p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors">
          <h3 className="text-lg font-semibold mb-2">Manage Payouts</h3>
          <p className="text-muted-foreground mb-4">Process pending payout requests</p>
          <Button className="bg-gradient-primary">View Payouts</Button>
        </Link>
      </div>
    </AppLayout>
  );
};

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="p-5 rounded-xl bg-card border border-border">
      <div className="p-2 rounded-lg bg-primary/10 w-fit mb-3">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

export default AdminDashboard;
