import { AppLayout } from "@/components/app/AppLayout";
import { useAllPayouts } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, Copy, Wallet, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { mapErrorToUserMessage, logError } from "@/lib/errorMapping";

const AdminPayouts = () => {
  const { data: payouts, isLoading } = useAllPayouts();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleAction = async (id: string, action: "approve" | "paid" | "reject") => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-payout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({ payout_id: id, action }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to process payout");
      queryClient.invalidateQueries({ queryKey: ["payouts"] });
      toast({ title: `Payout ${action === "paid" ? "paid" : action + "d"}` });
    } catch (error: unknown) {
      logError("AdminPayouts:handleAction", error);
      toast({ title: "Error", description: mapErrorToUserMessage(error), variant: "destructive" });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard` });
  };

  return (
    <AppLayout title="Manage Payouts">
      <div className="max-w-4xl mx-auto page-enter">
        {isLoading ? (
          <div className="space-y-4">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
        ) : payouts?.length === 0 ? (
          <div className="p-8 rounded-2xl bg-card/50 border border-border/30 text-center text-muted-foreground">
            <Wallet className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="font-display">No payout requests yet</p>
          </div>
        ) : (
          <div className="space-y-4 stagger-enter">
            {payouts?.map((payout: any) => (
              <div key={payout.id} className="p-4 sm:p-5 rounded-2xl bg-card/50 border border-border/30 hover:border-primary/15 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">
                {/* Top: Name + Amount */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="font-display font-bold text-base sm:text-lg truncate">{payout.user_profile?.full_name || "User"}</p>
                    <p className="text-sm text-muted-foreground truncate">{payout.user_profile?.email}</p>
                  </div>
                  <span className="font-display font-bold text-primary text-xl sm:text-2xl flex-shrink-0">${Number(payout.amount).toFixed(2)}</span>
                </div>

                {/* Payment details */}
                <div className="p-3 rounded-xl bg-secondary/20 border border-border/15 space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Wallet className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium capitalize">
                      {payout.payout_method === "usdc_solana" ? "USDC (Solana)" : payout.payout_method}
                    </span>
                  </div>
                  
                  {payout.payout_method === "paypal" && payout.payout_email && (
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-muted-foreground flex-shrink-0">PayPal:</span>
                      <code className="text-xs bg-card/50 px-2 py-1 rounded-lg truncate">{payout.payout_email}</code>
                      <Button size="icon" variant="ghost" className="h-6 w-6 flex-shrink-0" onClick={() => copyToClipboard(payout.payout_email, "PayPal email")}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  
                  {payout.payout_method === "usdc_solana" && payout.user_profile?.solana_wallet_address && (
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-muted-foreground flex-shrink-0">Wallet:</span>
                      <code className="text-xs bg-card/50 px-2 py-1 rounded-lg font-mono truncate">
                        {payout.user_profile.solana_wallet_address}
                      </code>
                      <Button size="icon" variant="ghost" className="h-6 w-6 flex-shrink-0" onClick={() => copyToClipboard(payout.user_profile.solana_wallet_address, "Wallet address")}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  {payout.payout_method === "usdc_solana" && !payout.user_profile?.solana_wallet_address && (
                    <p className="text-xs text-yellow-500">No Solana wallet address on file</p>
                  )}
                  {payout.payout_method === "paypal" && !payout.payout_email && (
                    <p className="text-xs text-yellow-500">No PayPal email on file</p>
                  )}
                </div>

                {/* Status + Actions */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block text-xs px-3 py-1 rounded-lg backdrop-blur-sm ${
                      payout.status === "paid" ? "bg-emerald-500/10 text-emerald-400" :
                      payout.status === "rejected" ? "bg-red-500/10 text-red-400" :
                      "bg-yellow-500/10 text-yellow-400"
                    }`}>{payout.status}</span>
                    {payout.processed_at && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(payout.processed_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {payout.status === "pending" && (
                      <>
                        <Button size="sm" onClick={() => handleAction(payout.id, "approve")} className="bg-emerald-500 hover:bg-emerald-600 rounded-xl btn-shimmer text-xs">
                          <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleAction(payout.id, "reject")} className="rounded-xl text-xs">
                          <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                    {payout.status === "approved" && (
                      <Button size="sm" onClick={() => handleAction(payout.id, "paid")} className="bg-gradient-primary hover:opacity-90 rounded-xl btn-shimmer text-xs">
                        <DollarSign className="h-3.5 w-3.5 mr-1" /> Mark Paid
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AdminPayouts;
