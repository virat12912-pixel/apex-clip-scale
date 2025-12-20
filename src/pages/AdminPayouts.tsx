import { AppLayout } from "@/components/app/AppLayout";
import { useAllPayouts, useUpdatePayout } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, Copy, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mapErrorToUserMessage, logError } from "@/lib/errorMapping";

const AdminPayouts = () => {
  const { data: payouts, isLoading } = useAllPayouts();
  const updatePayout = useUpdatePayout();
  const { toast } = useToast();

  const handleAction = async (id: string, status: "approved" | "rejected") => {
    try {
      await updatePayout.mutateAsync({ id, status });
      toast({ title: `Payout ${status}` });
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
      {isLoading ? (
        <div className="space-y-4">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : payouts?.length === 0 ? (
        <div className="p-8 rounded-xl bg-card border border-border text-center text-muted-foreground">
          No payout requests yet
        </div>
      ) : (
        <div className="space-y-4">
          {payouts?.map((payout: any) => (
            <div key={payout.id} className="p-5 rounded-xl bg-card border border-border">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  {/* Creator Info */}
                  <div>
                    <p className="font-semibold text-lg">{payout.user_profile?.full_name || "User"}</p>
                    <p className="text-sm text-muted-foreground">{payout.user_profile?.email}</p>
                  </div>

                  {/* Payment Details */}
                  <div className="p-3 rounded-lg bg-secondary/50 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium capitalize">
                        {payout.payout_method === "usdc_solana" ? "USDC (Solana)" : payout.payout_method}
                      </span>
                    </div>
                    
                    {payout.payout_method === "paypal" && payout.payout_email && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">PayPal:</span>
                        <code className="text-sm bg-background px-2 py-1 rounded">{payout.payout_email}</code>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(payout.payout_email, "PayPal email")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    
                    {payout.payout_method === "usdc_solana" && payout.user_profile?.solana_wallet_address && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Wallet:</span>
                        <code className="text-xs bg-background px-2 py-1 rounded font-mono truncate max-w-[200px]">
                          {payout.user_profile.solana_wallet_address}
                        </code>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(payout.user_profile.solana_wallet_address, "Wallet address")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    )}

                    {/* Missing payment details warning */}
                    {payout.payout_method === "usdc_solana" && !payout.user_profile?.solana_wallet_address && (
                      <p className="text-xs text-yellow-500">No Solana wallet address on file</p>
                    )}
                    {payout.payout_method === "paypal" && !payout.payout_email && (
                      <p className="text-xs text-yellow-500">No PayPal email on file</p>
                    )}
                  </div>

                  {/* Status Badge */}
                  <span className={`inline-block text-xs px-3 py-1 rounded-full ${
                    payout.status === "paid" ? "bg-emerald-500/10 text-emerald-400" :
                    payout.status === "rejected" ? "bg-red-500/10 text-red-400" :
                    "bg-yellow-500/10 text-yellow-400"
                  }`}>{payout.status}</span>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <span className="font-bold text-primary text-2xl">${Number(payout.amount).toFixed(2)}</span>
                  
                  {payout.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleAction(payout.id, "approved")} className="bg-emerald-500 hover:bg-emerald-600">
                        <CheckCircle className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleAction(payout.id, "rejected")}>
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </div>
                  )}

                  {payout.processed_at && (
                    <p className="text-xs text-muted-foreground">
                      Processed: {new Date(payout.processed_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default AdminPayouts;
