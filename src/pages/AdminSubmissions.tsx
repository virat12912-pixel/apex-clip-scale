import { useState } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { useAllSubmissions, useUpdateSubmission } from "@/hooks/useSubmissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, CheckCircle, XCircle, Eye, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { mapErrorToUserMessage, logError } from "@/lib/errorMapping";

const AdminSubmissions = () => {
  const { data: submissions, isLoading, refetch } = useAllSubmissions();
  const updateSubmission = useUpdateSubmission();
  const { toast } = useToast();
  const [viewInputs, setViewInputs] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    const views = parseInt(viewInputs[id] || "0", 10);
    
    if (views <= 0) {
      toast({
        title: "Enter view count",
        description: "Please enter the verified view count before approving",
        variant: "destructive",
      });
      return;
    }

    setProcessing(id);

    try {
      const { data, error } = await supabase.functions.invoke("calculate-earnings", {
        body: { submission_id: id, verified_views: views },
      });

      if (error) throw error;

      toast({
        title: "Submission approved!",
        description: `Earnings calculated: $${data.earnings}`,
      });
      refetch();
    } catch (error: unknown) {
      logError("AdminSubmissions:handleApprove", error);
      toast({ title: "Error", description: mapErrorToUserMessage(error), variant: "destructive" });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateSubmission.mutateAsync({ id, status: "rejected" });
      toast({ title: "Submission rejected" });
    } catch (error: unknown) {
      logError("AdminSubmissions:handleReject", error);
      toast({ title: "Error", description: mapErrorToUserMessage(error), variant: "destructive" });
    }
  };

  const pendingSubs = submissions?.filter((s) => s.status === "pending") || [];
  const processedSubs = submissions?.filter((s) => s.status !== "pending") || [];

  return (
    <AppLayout title="Manage Submissions">
      {/* Pending Submissions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Pending Review ({pendingSubs.length})</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : pendingSubs.length === 0 ? (
          <div className="p-8 rounded-xl bg-card border border-border text-center text-muted-foreground">
            No pending submissions
          </div>
        ) : (
          <div className="space-y-4">
            {pendingSubs.map((sub) => (
              <div key={sub.id} className="p-6 rounded-xl bg-card border border-border">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">{sub.creator_profile?.full_name || "Creator"}</h3>
                    <p className="text-sm text-muted-foreground">{sub.campaign?.name}</p>
                  </div>
                  <a
                    href={sub.clip_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm flex items-center gap-1"
                  >
                    View Clip <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Verified Views</span>
                    </div>
                    <Input
                      type="number"
                      placeholder="Enter view count"
                      value={viewInputs[sub.id] || ""}
                      onChange={(e) => setViewInputs({ ...viewInputs, [sub.id]: e.target.value })}
                      className="bg-secondary"
                    />
                  </div>
                  <div className="flex gap-2 pt-5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(sub.id)}
                      disabled={processing === sub.id}
                      className="text-red-400 hover:text-red-300"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(sub.id)}
                      disabled={processing === sub.id}
                      className="bg-emerald-500 hover:bg-emerald-600"
                    >
                      {processing === sub.id ? "Processing..." : (
                        <><CheckCircle className="h-4 w-4 mr-1" />Approve</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Processed Submissions */}
      {processedSubs.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Processed ({processedSubs.length})</h2>
          <div className="space-y-3">
            {processedSubs.map((sub) => (
              <div key={sub.id} className="p-4 rounded-xl bg-card border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    sub.status === "approved" || sub.status === "paid"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-red-500/10 text-red-400"
                  }`}>
                    {sub.status === "approved" || sub.status === "paid" ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <XCircle className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{sub.creator_profile?.full_name}</div>
                    <div className="text-sm text-muted-foreground">{sub.campaign?.name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {(sub.status === "approved" || sub.status === "paid") && (
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">{sub.views.toLocaleString()} views</div>
                      <div className="font-semibold text-primary flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {Number(sub.earnings).toFixed(2)}
                      </div>
                    </div>
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs capitalize ${
                    sub.status === "approved" || sub.status === "paid"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-red-500/10 text-red-400"
                  }`}>
                    {sub.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default AdminSubmissions;
