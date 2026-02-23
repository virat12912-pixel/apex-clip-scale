import { useState } from "react";
import { 
  Wallet, TrendingUp, TrendingDown, Clock, PlusCircle,
  AlertTriangle, ArrowUpRight, ArrowDownRight, CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ElevatedCard, ElevatedCardContent, ElevatedCardHeader, ElevatedCardTitle } from "@/components/ui/elevated-card";
import { ExecutiveKPICard } from "@/components/dashboard/ExecutiveKPICard";
import { SectionDivider } from "@/components/ui/section-divider";
import { useClientBalance, useBalanceTransactions, useRequestTopUp } from "@/hooks/useClientBalance";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const LOW_BALANCE_THRESHOLD = 100;

export function ClientBalanceSection() {
  const { data: balance, isLoading: balanceLoading } = useClientBalance();
  const { data: transactions, isLoading: txLoading } = useBalanceTransactions();
  const requestTopUp = useRequestTopUp();
  const { toast } = useToast();
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpNotes, setTopUpNotes] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleTopUpRequest = async () => {
    const amount = parseFloat(topUpAmount);
    if (!amount || amount <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }
    try {
      await requestTopUp.mutateAsync({ amount, notes: topUpNotes || undefined });
      toast({ title: "Top-up request submitted", description: "An admin will review your request." });
      setTopUpAmount("");
      setTopUpNotes("");
      setDialogOpen(false);
    } catch {
      toast({ title: "Failed to submit request", variant: "destructive" });
    }
  };

  const isLowBalance = (balance?.available_balance || 0) < LOW_BALANCE_THRESHOLD;
  const availableBalance = Number(balance?.available_balance || 0);
  const totalFunded = Number(balance?.total_funded || 0);
  const totalSpent = Number(balance?.total_spent || 0);
  const pendingSpend = Number(balance?.pending_spend || 0);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "credit": return <ArrowUpRight className="h-4 w-4 text-emerald-400" />;
      case "debit":
      case "campaign_spend": return <ArrowDownRight className="h-4 w-4 text-red-400" />;
      case "topup_request": return <Clock className="h-4 w-4 text-yellow-400" />;
      default: return <CreditCard className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "credit": return "text-emerald-400";
      case "debit":
      case "campaign_spend": return "text-red-400";
      case "topup_request": return "text-yellow-400";
      default: return "text-muted-foreground";
    }
  };

  if (balanceLoading) {
    return (
      <div className="space-y-4 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-8">
      {/* Low Balance Alert */}
      {isLowBalance && availableBalance > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-sm">Low Balance Warning</p>
            <p className="text-xs text-yellow-300/70">Your balance is below ${LOW_BALANCE_THRESHOLD}. Campaigns will auto-pause when balance reaches $0.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30">
                Top Up
              </Button>
            </DialogTrigger>
            <TopUpDialogContent
              topUpAmount={topUpAmount}
              setTopUpAmount={setTopUpAmount}
              topUpNotes={topUpNotes}
              setTopUpNotes={setTopUpNotes}
              onSubmit={handleTopUpRequest}
              isLoading={requestTopUp.isPending}
            />
          </Dialog>
        </div>
      )}

      {availableBalance === 0 && totalFunded > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-sm">Balance Depleted</p>
            <p className="text-xs text-red-300/70">All active campaigns are paused. Top up your balance to resume.</p>
          </div>
        </div>
      )}

      {/* Balance KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-enter">
        <ExecutiveKPICard
          icon={Wallet}
          label="Available Balance"
          value={`$${availableBalance.toFixed(2)}`}
          variant={isLowBalance ? "warning" : "success"}
        />
        <ExecutiveKPICard
          icon={TrendingUp}
          label="Total Funded"
          value={`$${totalFunded.toFixed(2)}`}
          variant="primary"
        />
        <ExecutiveKPICard
          icon={TrendingDown}
          label="Total Spent"
          value={`$${totalSpent.toFixed(2)}`}
          variant="default"
        />
        <ExecutiveKPICard
          icon={Clock}
          label="Pending Spend"
          value={`$${pendingSpend.toFixed(2)}`}
          variant="default"
        />
      </div>

      {/* Balance Usage Progress */}
      {totalFunded > 0 && (
        <ElevatedCard variant="elevated" className="rounded-2xl">
          <ElevatedCardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Overall Balance Usage</span>
              <span className="text-sm font-bold">{((totalSpent / totalFunded) * 100).toFixed(1)}%</span>
            </div>
            <Progress value={(totalSpent / totalFunded) * 100} className="h-2" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground/60">
              <span>${totalSpent.toFixed(2)} spent</span>
              <span>${availableBalance.toFixed(2)} remaining</span>
            </div>
          </ElevatedCardContent>
        </ElevatedCard>
      )}

      {/* Top-up button + History */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ElevatedCard variant="glass" className="rounded-2xl">
            <ElevatedCardHeader>
              <ElevatedCardTitle className="text-lg font-display">Quick Actions</ElevatedCardTitle>
            </ElevatedCardHeader>
            <ElevatedCardContent>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-gradient-primary hover:opacity-90 glow-primary-sm h-12 rounded-xl gap-2">
                    <PlusCircle className="h-5 w-5" />
                    Request Balance Top-Up
                  </Button>
                </DialogTrigger>
                <TopUpDialogContent
                  topUpAmount={topUpAmount}
                  setTopUpAmount={setTopUpAmount}
                  topUpNotes={topUpNotes}
                  setTopUpNotes={setTopUpNotes}
                  onSubmit={handleTopUpRequest}
                  isLoading={requestTopUp.isPending}
                />
              </Dialog>
            </ElevatedCardContent>
          </ElevatedCard>
        </div>

        {/* Balance History */}
        <ElevatedCard variant="elevated" className="lg:col-span-2 rounded-2xl">
          <ElevatedCardHeader>
            <ElevatedCardTitle className="text-lg font-display">Balance History</ElevatedCardTitle>
          </ElevatedCardHeader>
          <ElevatedCardContent>
            {txLoading ? (
              <div className="space-y-3">
                {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
              </div>
            ) : !transactions || transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground/50">
                <Wallet className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20 hover:bg-secondary/40 transition-all duration-200">
                    <div className="p-2 rounded-lg bg-secondary/40">
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{tx.description || tx.type}</p>
                      <p className="text-xs text-muted-foreground/50">
                        {tx.notes && <span>{tx.notes} · </span>}
                        {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-bold ${getTransactionColor(tx.type)}`}>
                        {tx.type === "credit" || tx.type === "topup_request" ? "+" : "-"}${Math.abs(Number(tx.amount)).toFixed(2)}
                      </span>
                      {tx.type === "topup_request" && (
                        <Badge className="ml-2 bg-yellow-500/15 text-yellow-400 border-yellow-500/20 text-[10px]">
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ElevatedCardContent>
        </ElevatedCard>
      </div>
    </div>
  );
}

function TopUpDialogContent({
  topUpAmount,
  setTopUpAmount,
  topUpNotes,
  setTopUpNotes,
  onSubmit,
  isLoading,
}: {
  topUpAmount: string;
  setTopUpAmount: (v: string) => void;
  topUpNotes: string;
  setTopUpNotes: (v: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}) {
  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Request Balance Top-Up</DialogTitle>
        <DialogDescription>
          Submit a top-up request. An admin will credit your balance after verifying payment.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 pt-2">
        <div className="space-y-2">
          <Label>Amount ($)</Label>
          <Input
            type="number"
            placeholder="500"
            value={topUpAmount}
            onChange={(e) => setTopUpAmount(e.target.value)}
            className="h-12 bg-secondary border-border"
          />
        </div>
        <div className="space-y-2">
          <Label>Payment Notes (optional)</Label>
          <Textarea
            placeholder="e.g., UPI payment, bank transfer ref #..."
            value={topUpNotes}
            onChange={(e) => setTopUpNotes(e.target.value)}
            className="bg-secondary border-border resize-none"
          />
        </div>
        <Button
          onClick={onSubmit}
          disabled={isLoading || !topUpAmount}
          className="w-full bg-gradient-primary hover:opacity-90 h-11"
        >
          {isLoading ? "Submitting..." : "Submit Top-Up Request"}
        </Button>
      </div>
    </DialogContent>
  );
}
