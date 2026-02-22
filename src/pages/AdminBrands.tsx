import { AppLayout } from "@/components/app/AppLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAllBrandApplications, useUpdateBrandApplication } from "@/hooks/useBrandApplications";
import { CheckCircle, XCircle, Clock, Building2, Mail } from "lucide-react";
import { format } from "date-fns";

const AdminBrands = () => {
  const { data: applications, isLoading } = useAllBrandApplications();
  const updateApplication = useUpdateBrandApplication();
  const { toast } = useToast();

  const handleAction = async (
    id: string,
    userId: string,
    status: "approved" | "rejected"
  ) => {
    try {
      await updateApplication.mutateAsync({ id, status, user_id: userId });
      toast({
        title: `Application ${status}`,
        description:
          status === "approved"
            ? "User has been upgraded to brand role"
            : "Application has been rejected",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const pendingApps = applications?.filter((a) => a.status === "pending") || [];
  const processedApps = applications?.filter((a) => a.status !== "pending") || [];

  return (
    <AppLayout title="Brand Applications">
      <div className="page-enter">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8 stagger-enter">
          <div className="p-4 rounded-2xl bg-card/50 border border-border/30 hover:border-primary/15 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">
            <div className="text-2xl font-display font-bold text-primary">{pendingApps.length}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
          <div className="p-4 rounded-2xl bg-card/50 border border-border/30 hover:border-primary/15 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">
            <div className="text-2xl font-display font-bold text-emerald-400">
              {applications?.filter((a) => a.status === "approved").length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Approved</div>
          </div>
          <div className="p-4 rounded-2xl bg-card/50 border border-border/30 hover:border-primary/15 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">
            <div className="text-2xl font-display font-bold text-red-400">
              {applications?.filter((a) => a.status === "rejected").length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Rejected</div>
          </div>
        </div>

        {/* Pending Applications */}
        <div className="mb-8">
          <h2 className="text-lg font-display font-bold mb-4">Pending Applications</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </div>
          ) : pendingApps.length === 0 ? (
            <div className="p-8 rounded-2xl bg-card/50 border border-border/30 text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No pending applications</p>
            </div>
          ) : (
            <div className="space-y-4 stagger-enter">
              {pendingApps.map((app) => (
                <div
                  key={app.id}
                  className="p-6 rounded-2xl bg-card/50 border border-border/30 hover:border-primary/15 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-primary glow-primary-sm flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold">{app.company_name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {app.email}
                        </div>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-lg text-xs bg-primary/10 text-primary backdrop-blur-sm">
                      Pending
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-secondary/20 border border-border/15 mb-4">
                    <div className="text-sm text-muted-foreground mb-1">Campaign Goals</div>
                    <p className="text-sm">{app.campaign_goals}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Applied {format(new Date(app.created_at), "MMM d, yyyy")}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(app.id, app.user_id, "rejected")}
                        disabled={updateApplication.isPending}
                        className="text-red-400 hover:text-red-300 rounded-xl border-border/30"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAction(app.id, app.user_id, "approved")}
                        disabled={updateApplication.isPending}
                        className="bg-emerald-500 hover:bg-emerald-600 rounded-xl btn-shimmer"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Processed Applications */}
        {processedApps.length > 0 && (
          <div>
            <h2 className="text-lg font-display font-bold mb-4">Processed Applications</h2>
            <div className="space-y-3 stagger-enter">
              {processedApps.map((app) => (
                <div
                  key={app.id}
                  className="p-4 rounded-2xl bg-card/50 border border-border/30 flex items-center justify-between hover:border-primary/15 transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl ${
                        app.status === "approved"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {app.status === "approved" ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <XCircle className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="font-display font-bold">{app.company_name}</div>
                      <div className="text-sm text-muted-foreground">{app.email}</div>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-lg text-xs capitalize backdrop-blur-sm ${
                      app.status === "approved"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AdminBrands;
