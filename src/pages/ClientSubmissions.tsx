import { Link } from "react-router-dom";
import { AppLayout } from "@/components/app/AppLayout";
import { useMyAssignedCampaigns } from "@/hooks/useCampaignAssignments";
import { useCampaignSubmissions } from "@/hooks/useSubmissions";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Film, Clock, CheckCircle } from "lucide-react";
import { useMemo } from "react";

const ClientSubmissions = () => {
  const { data: campaigns, isLoading: campaignsLoading } = useMyAssignedCampaigns();

  return (
    <AppLayout title="Manage Submissions">
      <div className="page-enter">
        <p className="text-muted-foreground mb-6">Select a campaign to review submissions</p>

        {campaignsLoading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
        ) : !campaigns?.length ? (
          <div className="p-8 rounded-2xl bg-card/50 border border-border/30 text-center text-muted-foreground">
            <Film className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="font-display">No campaigns assigned</p>
          </div>
        ) : (
          <div className="space-y-3 stagger-enter">
            {campaigns.map((campaign: any) => (
              <CampaignRow key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

function CampaignRow({ campaign }: { campaign: any }) {
  const { data: submissions } = useCampaignSubmissions(campaign.id);

  const stats = useMemo(() => {
    if (!submissions) return { pending: 0, approved: 0, total: 0 };
    let pending = 0, approved = 0;
    submissions.forEach((s: any) => {
      if (s.status === "pending") pending++;
      if (s.status === "approved" || s.status === "paid") approved++;
    });
    return { pending, approved, total: submissions.length };
  }, [submissions]);

  return (
    <Link
      to={`/client/submissions/${campaign.id}`}
      className="flex items-center justify-between p-5 rounded-2xl bg-card/50 border border-border/30 hover:border-primary/15 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-center gap-4">
        {campaign.image_url ? (
          <img src={campaign.image_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-gradient-primary glow-primary-sm flex items-center justify-center text-lg font-bold text-primary-foreground">
            {campaign.name.charAt(0)}
          </div>
        )}
        <div>
          <h3 className="font-display font-bold">{campaign.name}</h3>
          <p className="text-sm text-muted-foreground">{stats.total} submissions</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {stats.pending > 0 && (
          <span className="px-3 py-1 rounded-lg text-xs bg-yellow-500/10 text-yellow-400 backdrop-blur-sm flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {stats.pending} pending
          </span>
        )}
        {stats.approved > 0 && (
          <span className="px-3 py-1 rounded-lg text-xs bg-emerald-500/10 text-emerald-400 backdrop-blur-sm flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            {stats.approved} approved
          </span>
        )}
        <span className={`px-3 py-1 rounded-lg text-xs capitalize backdrop-blur-sm ${
          campaign.status === "active" ? "bg-emerald-500/10 text-emerald-400" :
          campaign.status === "paused" ? "bg-yellow-500/10 text-yellow-400" :
          "bg-secondary text-muted-foreground"
        }`}>
          {campaign.status}
        </span>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>
    </Link>
  );
}

export default ClientSubmissions;
