import { useCampaignSubmissions } from "@/hooks/useSubmissions";
import { useCampaignAnalytics } from "@/hooks/useCampaignAnalytics";
import { Skeleton } from "@/components/ui/skeleton";
import { ElevatedCard, ElevatedCardContent, ElevatedCardHeader, ElevatedCardTitle } from "@/components/ui/elevated-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ExecutiveKPICard } from "@/components/dashboard/ExecutiveKPICard";
import { ViewsChart } from "@/components/dashboard/ViewsChart";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DollarSign, Eye, Film, TrendingUp, Target, Trophy, BarChart3, ExternalLink } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: "hsl(var(--primary))",
  instagram: "hsl(320, 70%, 55%)",
  youtube: "hsl(0, 72%, 51%)",
};

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  instagram: "Reels",
  youtube: "Shorts",
};

interface Props {
  campaignId: string;
  campaigns: any[];
}

export function ClientCampaignWorkspace({ campaignId, campaigns }: Props) {
  const campaign = campaigns.find((c: any) => c.id === campaignId);
  const { data: submissions, isLoading: subsLoading } = useCampaignSubmissions(campaignId);
  const { data: analyticsData } = useCampaignAnalytics(campaignId, 30);

  if (!campaign) return null;

  const totalBudget = Number(campaign.total_budget);
  const spentBudget = Number(campaign.spent_budget);
  const remaining = totalBudget - spentBudget;
  const budgetPct = totalBudget > 0 ? (spentBudget / totalBudget) * 100 : 0;

  const approvedSubs = (submissions || []).filter((s: any) => s.status === "approved" || s.status === "paid");
  const totalViews = approvedSubs.reduce((sum: number, s: any) => sum + (s.views || 0), 0);
  const totalClips = approvedSubs.length;
  const avgViewsPerClip = totalClips > 0 ? Math.round(totalViews / totalClips) : 0;
  const cpm = totalViews > 0 ? (spentBudget / totalViews) * 1000 : 0;

  // Best performing clip
  const bestClip = approvedSubs.length
    ? approvedSubs.reduce((best: any, s: any) => (s.views || 0) > (best.views || 0) ? s : best, approvedSubs[0])
    : null;

  // Platform breakdown
  const platformMap = new Map<string, { views: number; clips: number }>();
  for (const s of approvedSubs) {
    const p = s.platform || "unknown";
    const existing = platformMap.get(p) || { views: 0, clips: 0 };
    existing.views += s.views || 0;
    existing.clips += 1;
    platformMap.set(p, existing);
  }
  const platformData = Array.from(platformMap.entries()).map(([name, data]) => ({
    name: PLATFORM_LABELS[name] || name,
    value: data.views,
    clips: data.clips,
    color: PLATFORM_COLORS[name] || "hsl(var(--muted-foreground))",
  }));

  return (
    <div className="space-y-8">
      {/* Campaign Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-display font-bold">{campaign.name}</h3>
          <Badge variant={campaign.status === "active" ? "default" : "secondary"} className="mt-1 capitalize">
            {campaign.status}
          </Badge>
        </div>
      </div>

      {/* ─── Primary KPI Grid (6 cards) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-enter">
        <ExecutiveKPICard icon={Eye} label="Total Views" value={formatNumber(totalViews)} variant="primary" />
        <ExecutiveKPICard icon={DollarSign} label="Budget Spent" value={`$${spentBudget.toFixed(2)}`} subValue={`of $${totalBudget.toFixed(0)} total`} variant="warning" />
        <ExecutiveKPICard icon={Target} label="Cost per 1K Views" value={totalViews > 0 ? `$${cpm.toFixed(2)}` : "—"} subValue="CPM" variant="default" />
        <ExecutiveKPICard icon={Film} label="Clips Published" value={totalClips.toString()} variant="success" />
        <ExecutiveKPICard icon={TrendingUp} label="Avg Views / Clip" value={formatNumber(avgViewsPerClip)} variant="primary" />
        <ExecutiveKPICard icon={DollarSign} label="Remaining Balance" value={`$${remaining.toFixed(0)}`} subValue={`${(100 - budgetPct).toFixed(1)}% remaining`} variant={budgetPct > 80 ? "danger" : "success"} />
      </div>

      {/* Budget Progress */}
      <ElevatedCard variant="elevated" className="rounded-2xl">
        <ElevatedCardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Spent: ${spentBudget.toFixed(2)}</span>
              <span className="text-muted-foreground">Budget: ${totalBudget.toFixed(0)}</span>
            </div>
            <Progress value={Math.min(budgetPct, 100)} className="h-3" />
            <p className="text-xs text-muted-foreground/60">{budgetPct.toFixed(1)}% of budget utilized</p>
          </div>
        </ElevatedCardContent>
      </ElevatedCard>

      {/* ─── Best Performing Clip ─── */}
      {bestClip && (
        <ElevatedCard variant="elevated" className="rounded-2xl border-primary/20">
          <ElevatedCardHeader>
            <ElevatedCardTitle className="font-display flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-400" />
              Best Performing Clip
            </ElevatedCardTitle>
          </ElevatedCardHeader>
          <ElevatedCardContent>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-accent/30 border border-accent/20">
              <div className="p-3 rounded-xl bg-accent/40 text-accent-foreground">
                <Eye className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <a href={bestClip.clip_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-primary truncate block flex items-center gap-1.5">
                  {bestClip.clip_url.length > 60 ? bestClip.clip_url.slice(0, 60) + "…" : bestClip.clip_url}
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                </a>
                <span className="text-xs text-muted-foreground/60 capitalize mt-0.5 block">{bestClip.platform} · {new Date(bestClip.created_at).toLocaleDateString()}</span>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-2xl font-display font-bold">{formatNumber(bestClip.views || 0)}</div>
                <div className="text-xs text-muted-foreground/60">views</div>
              </div>
            </div>
          </ElevatedCardContent>
        </ElevatedCard>
      )}

      {/* ─── Insights Section ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Views Growth Chart */}
        {analyticsData && analyticsData.length > 0 && (
          <ViewsChart data={analyticsData} title="Views Growth Trend" showEarnings={false} />
        )}

        {/* Platform Breakdown */}
        {platformData.length > 0 && (
          <ElevatedCard variant="elevated" className="rounded-2xl">
            <ElevatedCardHeader>
              <ElevatedCardTitle className="font-display flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Platform Breakdown
              </ElevatedCardTitle>
            </ElevatedCardHeader>
            <ElevatedCardContent>
              <div className="flex items-center gap-6">
                <div className="w-[140px] h-[140px] flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={platformData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={65} strokeWidth={0}>
                        {platformData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        }}
                        formatter={(value: number) => [formatNumber(value), 'Views']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-3">
                  {platformData.map((p) => (
                    <div key={p.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                        <span className="text-sm font-medium">{p.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold">{formatNumber(p.value)}</span>
                        <span className="text-xs text-muted-foreground/60 ml-2">{p.clips} clip{p.clips !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ElevatedCardContent>
          </ElevatedCard>
        )}
      </div>

      {/* ─── Content Review Feed ─── */}
      <ElevatedCard variant="elevated" className="rounded-2xl">
        <ElevatedCardHeader>
          <ElevatedCardTitle className="font-display flex items-center gap-2">
            <Film className="h-5 w-5 text-primary" />
            Live Content Feed
          </ElevatedCardTitle>
        </ElevatedCardHeader>
        <ElevatedCardContent>
          {subsLoading ? (
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          ) : !submissions?.length ? (
            <EmptyState icon={Film} title="No content yet" description="No clips have been published to this campaign yet." variant="minimal" />
          ) : (
            <div className="space-y-3">
              {submissions.map((sub: any) => (
                <div key={sub.id} className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 border border-border/20 hover:bg-secondary/50 transition-all">
                  <div className={`p-2 rounded-lg ${
                    sub.status === "approved" || sub.status === "paid"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : sub.status === "rejected"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-primary/10 text-primary"
                  }`}>
                    <Film className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <a href={sub.clip_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-primary truncate block">
                      {sub.clip_url}
                    </a>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground/60">
                      <span className="capitalize">{sub.platform}</span>
                      <span>{new Date(sub.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 text-sm font-semibold">
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      {formatNumber(sub.views || 0)}
                    </div>
                    <Badge variant="secondary" className="text-[10px] capitalize mt-1">{sub.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ElevatedCardContent>
      </ElevatedCard>
    </div>
  );
}
