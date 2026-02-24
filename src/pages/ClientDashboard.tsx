import { AppLayout } from "@/components/app/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useMyAssignedCampaigns } from "@/hooks/useCampaignAssignments";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { ClientCampaignWorkspace } from "@/components/client/ClientCampaignWorkspace";

const ClientDashboard = () => {
  const { profile } = useAuth();
  const { data: campaigns, isLoading: campaignsLoading } = useMyAssignedCampaigns();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  const activeCampaignId = selectedCampaignId || campaigns?.[0]?.id || null;

  return (
    <AppLayout title="Client Dashboard">
      {/* Welcome */}
      <div className="relative mb-8 p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-primary/10 overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/8 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 animate-pulse-glow" />
        <div className="relative">
          <h2 className="text-3xl font-display font-bold tracking-tight mb-2">
            Welcome, <span className="text-gradient">{profile?.full_name?.split(" ")[0] || "there"}</span>
          </h2>
          <p className="text-muted-foreground/70 text-lg">
            Your campaign performance at a glance.
          </p>
        </div>
      </div>

      {campaignsLoading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      ) : !campaigns?.length ? (
        <EmptyState
          icon={AlertCircle}
          title="No campaigns assigned"
          description="Your account hasn't been assigned any campaigns yet. Contact your account manager for setup."
          variant="gradient"
        />
      ) : (
        <>
          {campaigns.length > 1 && (
            <div className="flex gap-2 mb-6 flex-wrap">
              {campaigns.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCampaignId(c.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
                    activeCampaignId === c.id
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-card/50 text-muted-foreground border-border/30 hover:bg-card/80"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {activeCampaignId && <ClientCampaignWorkspace campaignId={activeCampaignId} campaigns={campaigns} />}
        </>
      )}
    </AppLayout>
  );
};

export default ClientDashboard;
