import { useState } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Wallet, Search, PlusCircle, MinusCircle, CheckCircle, Clock,
  ArrowUpRight, ArrowDownRight, CreditCard, DollarSign, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { ExecutiveKPICard } from "@/components/dashboard/ExecutiveKPICard";
import { ElevatedCard, ElevatedCardContent, ElevatedCardHeader, ElevatedCardTitle } from "@/components/ui/elevated-card";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

// Fetch all client balances with profile info
function useAllClientBalances() {
  return useQuery({
    queryKey: ["admin-client-balances"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_balances")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;

      // Fetch profiles for these users
      const userIds = data.map((b: any) => b.user_id);
      if (userIds.length === 0) return [];

      const { data: profiles, error: profError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);
      if (profError) throw profError;

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      return data.map((b: any) => ({
        ...b,
        profile: profileMap.get(b.user_id) || { full_name: "Unknown", email: "" },
      }));
    },
  });
}

// Fetch all balance transactions
function useAllBalanceTransactions(userId?: string) {
  return useQuery({
    queryKey: ["admin-balance-transactions", userId],
    queryFn: async () => {
      let query = supabase
        .from("balance_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

// Fetch pending top-up requests
function usePendingTopUps() {
  return useQuery({
    queryKey: ["admin-pending-topups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("balance_transactions")
        .select("*")
        .eq("type", "topup_request")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Get profiles
      const userIds = [...new Set((data || []).map((t: any) => t.user_id))];
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      return (data || []).map((t: any) => ({
        ...t,
        profile: profileMap.get(t.user_id) || { full_name: "Unknown", email: "" },
      }));
    },
  });
}

// All profiles for search
function useAllProfiles() {
  return useQuery({
    queryKey: ["admin-all-profiles-balance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name");
      if (error) throw error;
      return data || [];
    },
  });
}

const AdminBalances = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditNotes, setCreditNotes] = useState("");
  const [creditUserId, setCreditUserId] = useState("");
  const [actionType, setActionType] = useState<"credit" | "debit">("credit");

  const { data: balances, isLoading: balancesLoading } = useAllClientBalances();
  const { data: topUps, isLoading: topUpsLoading } = usePendingTopUps();
  const { data: transactions, isLoading: txLoading } = useAllBalanceTransactions(selectedUserId || undefined);
  const { data: allProfiles } = useAllProfiles();

  const totalAvailable = balances?.reduce((sum: number, b: any) => sum + Number(b.available_balance), 0) || 0;
  const totalFunded = balances?.reduce((sum: number, b: any) => sum + Number(b.total_funded), 0) || 0;
  const totalSpent = balances?.reduce((sum: number, b: any) => sum + Number(b.total_spent), 0) || 0;
  const pendingTopUps = topUps?.filter((t: any) => t.notes?.includes("Pending")) || [];

  const filteredBalances = balances?.filter((b: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return b.profile?.full_name?.toLowerCase().includes(q) || b.profile?.email?.toLowerCase().includes(q);
  }) || [];

  // Credit/debit mutation
  const balanceMutation = useMutation({
    mutationFn: async ({ userId, amount, type, notes }: { userId: string; amount: number; type: "credit" | "debit"; notes: string }) => {
      // Check if balance exists
      const { data: existing } = await supabase
        .from("client_balances")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (!existing) {
        // Create balance record
        const { error: createError } = await supabase
          .from("client_balances")
          .insert({
            user_id: userId,
            available_balance: type === "credit" ? amount : 0,
            total_funded: type === "credit" ? amount : 0,
          });
        if (createError) throw createError;
      } else {
        // Update existing
        const newAvailable = type === "credit"
          ? Number(existing.available_balance) + amount
          : Math.max(0, Number(existing.available_balance) - amount);
        const newFunded = type === "credit"
          ? Number(existing.total_funded) + amount
          : Number(existing.total_funded);
        const newSpent = type === "debit"
          ? Number(existing.total_spent) + amount
          : Number(existing.total_spent);

        const { error: updateError } = await supabase
          .from("client_balances")
          .update({
            available_balance: newAvailable,
            total_funded: newFunded,
            total_spent: newSpent,
          })
          .eq("user_id", userId);
        if (updateError) throw updateError;
      }

      // Log transaction
      const { error: txError } = await supabase
        .from("balance_transactions")
        .insert({
          user_id: userId,
          type: type,
          amount: amount,
          description: type === "credit" ? "Admin credit" : "Admin debit",
          notes: notes || (type === "credit" ? "Manual credit by admin" : "Manual debit by admin"),
        });
      if (txError) throw txError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-client-balances"] });
      queryClient.invalidateQueries({ queryKey: ["admin-balance-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-topups"] });
      toast({ title: `Balance ${actionType === "credit" ? "credited" : "debited"} successfully` });
      setCreditDialogOpen(false);
      setCreditAmount("");
      setCreditNotes("");
      setCreditUserId("");
    },
    onError: () => {
      toast({ title: "Failed to update balance", variant: "destructive" });
    },
  });

  // Approve top-up
  const approveTopUp = useMutation({
    mutationFn: async ({ txId, userId, amount }: { txId: string; userId: string; amount: number }) => {
      // Credit the balance
      const { data: existing } = await supabase
        .from("client_balances")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (!existing) {
        await supabase.from("client_balances").insert({
          user_id: userId,
          available_balance: amount,
          total_funded: amount,
        });
      } else {
        await supabase.from("client_balances").update({
          available_balance: Number(existing.available_balance) + amount,
          total_funded: Number(existing.total_funded) + amount,
        }).eq("user_id", userId);
      }

      // Log credit transaction
      await supabase.from("balance_transactions").insert({
        user_id: userId,
        type: "credit",
        amount,
        description: "Top-up approved",
        notes: "Approved by admin",
      });

      // Update original request notes
      await supabase.from("balance_transactions").update({
        notes: "Approved by admin",
      }).eq("id", txId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-client-balances"] });
      queryClient.invalidateQueries({ queryKey: ["admin-balance-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-topups"] });
      toast({ title: "Top-up approved and credited" });
    },
  });

  const handleSubmit = () => {
    const amount = parseFloat(creditAmount);
    if (!amount || amount <= 0 || !creditUserId) {
      toast({ title: "Enter a valid amount and select a user", variant: "destructive" });
      return;
    }
    balanceMutation.mutate({ userId: creditUserId, amount, type: actionType, notes: creditNotes });
  };

  const openCreditDialog = (type: "credit" | "debit", userId?: string) => {
    setActionType(type);
    setCreditUserId(userId || "");
    setCreditDialogOpen(true);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "credit": return <ArrowUpRight className="h-4 w-4 text-emerald-400" />;
      case "debit":
      case "campaign_spend": return <ArrowDownRight className="h-4 w-4 text-red-400" />;
      case "topup_request": return <Clock className="h-4 w-4 text-yellow-400" />;
      default: return <CreditCard className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <AppLayout title="Client Balances">
      <div className="page-enter">
        {/* KPI Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-enter">
          <ExecutiveKPICard icon={Wallet} label="Total Available" value={`$${totalAvailable.toFixed(2)}`} variant="success" />
          <ExecutiveKPICard icon={DollarSign} label="Total Funded" value={`$${totalFunded.toFixed(2)}`} variant="primary" />
          <ExecutiveKPICard icon={DollarSign} label="Total Spent" value={`$${totalSpent.toFixed(2)}`} variant="default" />
          <ExecutiveKPICard icon={Clock} label="Pending Top-ups" value={pendingTopUps.length.toString()} subValue={pendingTopUps.length > 0 ? "Awaiting approval" : "All clear"} variant={pendingTopUps.length > 0 ? "warning" : "default"} />
        </div>

        {/* Pending Top-up Requests */}
        {pendingTopUps.length > 0 && (
          <ElevatedCard variant="elevated" className="rounded-2xl mb-8">
            <ElevatedCardHeader>
              <ElevatedCardTitle className="text-lg font-display flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-400" />
                Pending Top-Up Requests ({pendingTopUps.length})
              </ElevatedCardTitle>
            </ElevatedCardHeader>
            <ElevatedCardContent>
              <div className="space-y-3">
                {pendingTopUps.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/15 hover:bg-yellow-500/10 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-yellow-500/10">
                        <Clock className="h-4 w-4 text-yellow-400" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{tx.profile?.full_name || "User"}</p>
                        <p className="text-xs text-muted-foreground">{tx.profile?.email} · {new Date(tx.created_at).toLocaleDateString()}</p>
                        {tx.notes && <p className="text-xs text-muted-foreground/70 mt-0.5">{tx.notes}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-display font-bold text-lg text-yellow-400">${Number(tx.amount).toFixed(2)}</span>
                      <Button
                        size="sm"
                        onClick={() => approveTopUp.mutate({ txId: tx.id, userId: tx.user_id, amount: Number(tx.amount) })}
                        disabled={approveTopUp.isPending}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ElevatedCardContent>
          </ElevatedCard>
        )}

        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-12 bg-card/50 border-border/40 rounded-xl"
            />
          </div>
          <Button onClick={() => openCreditDialog("credit")} className="bg-emerald-600 hover:bg-emerald-700 h-12 rounded-xl gap-2">
            <PlusCircle className="h-5 w-5" />
            Credit Balance
          </Button>
          <Button onClick={() => openCreditDialog("debit")} variant="outline" className="h-12 rounded-xl gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10">
            <MinusCircle className="h-5 w-5" />
            Debit Balance
          </Button>
        </div>

        {/* Client Balances Table */}
        <div className="grid lg:grid-cols-3 gap-6">
          <ElevatedCard variant="elevated" className="lg:col-span-2 rounded-2xl">
            <ElevatedCardHeader>
              <ElevatedCardTitle className="text-lg font-display flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Client Balances ({filteredBalances.length})
              </ElevatedCardTitle>
            </ElevatedCardHeader>
            <ElevatedCardContent>
              {balancesLoading ? (
                <div className="space-y-3">
                  {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
                </div>
              ) : filteredBalances.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground/50">
                  <Wallet className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">{searchQuery ? "No matching clients" : "No client balances yet"}</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {filteredBalances.map((b: any) => {
                    const available = Number(b.available_balance);
                    const funded = Number(b.total_funded);
                    const spent = Number(b.total_spent);
                    const usagePercent = funded > 0 ? (spent / funded) * 100 : 0;
                    const isLow = available < 100 && funded > 0;

                    return (
                      <div
                        key={b.id}
                        onClick={() => setSelectedUserId(b.user_id === selectedUserId ? null : b.user_id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                          selectedUserId === b.user_id
                            ? "border-primary/40 bg-primary/5"
                            : "border-border/30 bg-secondary/20 hover:bg-secondary/40"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-semibold text-sm">{b.profile?.full_name || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground/60">{b.profile?.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {isLow && (
                              <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/20 text-[10px]">
                                Low
                              </Badge>
                            )}
                            <span className={`font-display font-bold text-lg ${isLow ? "text-yellow-400" : "text-emerald-400"}`}>
                              ${available.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mb-2">
                          <div>Funded: <span className="text-foreground font-medium">${funded.toFixed(2)}</span></div>
                          <div>Spent: <span className="text-foreground font-medium">${spent.toFixed(2)}</span></div>
                          <div>Pending: <span className="text-foreground font-medium">${Number(b.pending_spend).toFixed(2)}</span></div>
                        </div>
                        {funded > 0 && (
                          <Progress value={usagePercent} className="h-1.5" />
                        )}
                        <div className="flex justify-end gap-2 mt-3">
                          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openCreditDialog("credit", b.user_id); }}
                            className="text-emerald-400 hover:bg-emerald-500/10 h-8 text-xs">
                            <PlusCircle className="h-3 w-3 mr-1" /> Credit
                          </Button>
                          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openCreditDialog("debit", b.user_id); }}
                            className="text-red-400 hover:bg-red-500/10 h-8 text-xs">
                            <MinusCircle className="h-3 w-3 mr-1" /> Debit
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ElevatedCardContent>
          </ElevatedCard>

          {/* Transaction History */}
          <ElevatedCard variant="spotlight" className="rounded-2xl">
            <ElevatedCardHeader>
              <ElevatedCardTitle className="text-lg font-display">
                {selectedUserId ? "User Transactions" : "All Transactions"}
              </ElevatedCardTitle>
            </ElevatedCardHeader>
            <ElevatedCardContent>
              {txLoading ? (
                <div className="space-y-3">
                  {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
                </div>
              ) : !transactions || transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground/50">
                  <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No transactions</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {transactions.map((tx: any) => (
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
                      <span className={`text-sm font-bold ${
                        tx.type === "credit" ? "text-emerald-400" : 
                        tx.type === "topup_request" ? "text-yellow-400" : "text-red-400"
                      }`}>
                        {tx.type === "credit" || tx.type === "topup_request" ? "+" : "-"}${Math.abs(Number(tx.amount)).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ElevatedCardContent>
          </ElevatedCard>
        </div>

        {/* Credit/Debit Dialog */}
        <Dialog open={creditDialogOpen} onOpenChange={setCreditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{actionType === "credit" ? "Credit" : "Debit"} Client Balance</DialogTitle>
              <DialogDescription>
                {actionType === "credit"
                  ? "Add funds to a client's available balance."
                  : "Deduct funds from a client's available balance."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Select User</Label>
                <Select value={creditUserId} onValueChange={setCreditUserId}>
                  <SelectTrigger className="h-12 bg-secondary border-border">
                    <SelectValue placeholder="Choose a user..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allProfiles?.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.full_name || p.email} — {p.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount ($)</Label>
                <Input
                  type="number"
                  placeholder="500"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  className="h-12 bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder={actionType === "credit" ? "e.g., UPI payment received, bank transfer..." : "e.g., Refund deduction, correction..."}
                  value={creditNotes}
                  onChange={(e) => setCreditNotes(e.target.value)}
                  className="bg-secondary border-border resize-none"
                />
              </div>
              <Button
                onClick={handleSubmit}
                disabled={balanceMutation.isPending || !creditAmount || !creditUserId}
                className={`w-full h-11 ${actionType === "credit" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"} text-white`}
              >
                {balanceMutation.isPending ? "Processing..." : `${actionType === "credit" ? "Credit" : "Debit"} Balance`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default AdminBalances;
