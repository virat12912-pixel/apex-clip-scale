import { AppLayout } from "@/components/app/AppLayout";
import { useAllPayouts, useUpdatePayout } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminPayouts = () => {
  const { data: payouts, isLoading } = useAllPayouts();
  const updatePayout = useUpdatePayout();
  const { toast } = useToast();

  const handleAction = async (id: string, status: "approved" | "rejected") => {
    try {
      await updatePayout.mutateAsync({ id, status });
      toast({ title: `Payout ${status}` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <AppLayout title="Manage Payouts">
      {isLoading ? (
        <div className="space-y-4">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : (
        <div className="space-y-4">
          {payouts?.map((payout: any) => (
            <div key={payout.id} className="p-4 rounded-xl bg-card border border-border flex items-center justify-between">
              <div>
                <p className="font-medium">{payout.user_profile?.full_name || "User"}</p>
                <p className="text-sm text-muted-foreground">{payout.payout_email} via {payout.payout_method}</p>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  payout.status === "paid" ? "bg-emerald-500/10 text-emerald-400" :
                  payout.status === "rejected" ? "bg-red-500/10 text-red-400" :
                  "bg-yellow-500/10 text-yellow-400"
                }`}>{payout.status}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-primary text-lg">${Number(payout.amount).toFixed(2)}</span>
                {payout.status === "pending" && (
                  <>
                    <Button size="sm" onClick={() => handleAction(payout.id, "approved")}>
                      <CheckCircle className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleAction(payout.id, "rejected")}>
                      <XCircle className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default AdminPayouts;
