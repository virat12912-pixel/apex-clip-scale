import { AppLayout } from "@/components/app/AppLayout";
import { useAllSubmissions, useUpdateSubmission } from "@/hooks/useSubmissions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminSubmissions = () => {
  const { data: submissions, isLoading } = useAllSubmissions();
  const updateSubmission = useUpdateSubmission();
  const { toast } = useToast();

  const handleAction = async (id: string, status: "approved" | "rejected") => {
    try {
      await updateSubmission.mutateAsync({ id, status });
      toast({ title: `Submission ${status}` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <AppLayout title="Manage Submissions">
      {isLoading ? (
        <div className="space-y-4">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : (
        <div className="space-y-4">
          {submissions?.map((sub) => (
            <div key={sub.id} className="p-4 rounded-xl bg-card border border-border flex items-center justify-between">
              <div>
                <p className="font-medium">{sub.creator_profile?.full_name || "Creator"}</p>
                <p className="text-sm text-muted-foreground">{sub.campaign?.name}</p>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  sub.status === "approved" ? "bg-emerald-500/10 text-emerald-400" :
                  sub.status === "rejected" ? "bg-red-500/10 text-red-400" :
                  "bg-primary/10 text-primary"
                }`}>{sub.status}</span>
              </div>
              <div className="flex items-center gap-2">
                <a href={sub.clip_url} target="_blank" rel="noopener noreferrer" className="text-primary">
                  <ExternalLink className="h-4 w-4" />
                </a>
                {sub.status === "pending" && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => handleAction(sub.id, "approved")}>
                      <CheckCircle className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleAction(sub.id, "rejected")}>
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

export default AdminSubmissions;
