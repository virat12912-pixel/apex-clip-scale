import { AppLayout } from "@/components/app/AppLayout";
import { DollarSign, TrendingUp, ArrowUpRight, Clock, Eye, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet, usePayouts, useRequestPayout } from "@/hooks/useWallet";
import { useMySubmissions } from "@/hooks/useSubmissions";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const Earnings = () => {
  const { data: wallet, isLoading: walletLoading } = useWallet();
  const { data: payouts, isLoading: payoutsLoading } = usePayouts();
  const { data: submissions, isLoading: submissionsLoading } = useMySubmissions();
  const requestPayout = useRequestPayout();
  const { toast } = useToast();

  const totalEarnings = submissions?.reduce((sum, s) => sum + Number(s.earnings || 0), 0) || 0;
  const paidSubmissions = submissions?.filter(s => s.status === "paid" || s.status === "approved") || [];

  const handleRequestPayout = async () => {
    if (!wallet || wallet.pending_balance < 50) {
      toast({ title: "Minimum $50 required", variant: "destructive" });
      return;
    }
    try {
      await requestPayout.mutateAsync(wallet.pending_balance);
      toast({ title: "Payout requested" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <AppLayout title="Earnings">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {walletLoading ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32" />) : (
          <>
            <div className="p-5 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-emerald-500/10"><DollarSign className="h-5 w-5 text-emerald-400" /></div>
              </div>
              <div className="text-2xl font-bold mb-1">${totalEarnings.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Total Earnings</div>
            </div>
            <div className="p-5 rounded-xl bg-card border border-border">
              <div className="p-2 rounded-lg bg-yellow-500/10 w-fit mb-3"><Clock className="h-5 w-5 text-yellow-400" /></div>
              <div className="text-2xl font-bold mb-1">${(wallet?.pending_balance || 0).toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Pending Balance</div>
            </div>
            <div className="p-5 rounded-xl bg-card border border-border">
              <div className="p-2 rounded-lg bg-primary/10 w-fit mb-3"><TrendingUp className="h-5 w-5 text-primary" /></div>
              <div className="text-2xl font-bold mb-1">${(wallet?.paid_balance || 0).toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Paid Out</div>
            </div>
            <div className="p-5 rounded-xl bg-card border border-border">
              <div className="p-2 rounded-lg bg-blue-500/10 w-fit mb-3"><Eye className="h-5 w-5 text-blue-400" /></div>
              <div className="text-2xl font-bold mb-1">{paidSubmissions.length}</div>
              <div className="text-sm text-muted-foreground">Paid Clips</div>
            </div>
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-xl bg-card border border-border">
          <h3 className="text-lg font-semibold mb-6">Earnings History</h3>
          {submissionsLoading ? <Skeleton className="h-40" /> : paidSubmissions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No earnings yet</p>
          ) : (
            <div className="space-y-3">
              {paidSubmissions.slice(0, 10).map((sub) => (
                <div key={sub.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div>
                    <p className="font-medium">{sub.campaign?.name}</p>
                    <p className="text-sm text-muted-foreground">{sub.views.toLocaleString()} views</p>
                  </div>
                  <span className="font-semibold text-primary">${Number(sub.earnings).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 rounded-xl bg-card border border-border">
          <h3 className="text-lg font-semibold mb-6">Payout</h3>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="text-sm text-muted-foreground">Available</div>
              <div className="text-2xl font-bold text-primary">${(wallet?.pending_balance || 0).toFixed(2)}</div>
            </div>
            <Button onClick={handleRequestPayout} disabled={requestPayout.isPending || (wallet?.pending_balance || 0) < 50} className="w-full bg-gradient-primary">
              Request Payout
            </Button>
            <p className="text-xs text-muted-foreground text-center">Minimum $50 required</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Earnings;
