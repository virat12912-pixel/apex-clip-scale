import { useState } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { 
  Search, Filter, DollarSign, Eye, ArrowRight,
  Gamepad2, Dumbbell, Laptop, Music, Utensils, Sparkles, AlertCircle,
  Smartphone, Camera, Play, ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { useCampaigns, CampaignStatus } from "@/hooks/useCampaigns";
import { useAuth } from "@/hooks/useAuth";
import { CampaignFiltersModal, FilterValues } from "@/components/campaigns/CampaignFiltersModal";
import { EmptyState } from "@/components/ui/empty-state";

const categories = [
  { id: "all", label: "All", icon: Sparkles },
  { id: "gaming", label: "Gaming", icon: Gamepad2 },
  { id: "fitness", label: "Fitness", icon: Dumbbell },
  { id: "tech", label: "Tech", icon: Laptop },
  { id: "music", label: "Music", icon: Music },
  { id: "food", label: "Food", icon: Utensils },
];

const platformIcons: Record<string, React.ReactNode> = {
  tiktok: <Smartphone className="h-3.5 w-3.5" />,
  instagram: <Camera className="h-3.5 w-3.5" />,
  youtube: <Play className="h-3.5 w-3.5" />,
};

const Campaigns = () => {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "all">("active");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({
    platforms: [],
    minRate: 0,
    maxRate: 500,
    minViews: 0,
  });

  const effectiveStatus = isAdmin ? statusFilter : statusFilter;

  const { data: campaigns, isLoading } = useCampaigns({
    status: effectiveStatus,
    niche: selectedCategory === "all" ? undefined : selectedCategory,
    search: searchQuery || undefined,
  });

  const filteredCampaigns = campaigns?.filter((campaign) => {
    if (filters.platforms.length > 0) {
      const hasMatchingPlatform = campaign.platforms?.some((p) =>
        filters.platforms.includes(p)
      );
      if (!hasMatchingPlatform) return false;
    }
    if (campaign.rate_value < filters.minRate || campaign.rate_value > filters.maxRate) return false;
    if (filters.minViews > 0 && campaign.min_views > filters.minViews) return false;
    return true;
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const getStatusColor = (status: CampaignStatus) => {
    switch (status) {
      case "active": return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
      case "paused": return "bg-yellow-500/15 text-yellow-400 border-yellow-500/20";
      case "completed": return "bg-gray-500/15 text-gray-400 border-gray-500/20";
      case "private": return "bg-purple-500/15 text-purple-400 border-purple-500/20";
      default: return "bg-primary/15 text-primary border-primary/20";
    }
  };

  const hasActiveFilters = filters.platforms.length > 0 || filters.minRate > 0 || filters.maxRate < 500 || filters.minViews > 0;

  return (
    <AppLayout title="Browse Campaigns">
      {/* Status Tabs - Admin Only */}
      <div className="mb-6">
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as CampaignStatus | "all")}>
          <TabsList className="bg-secondary/30 backdrop-blur-sm">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            {isAdmin && (
              <>
                <TabsTrigger value="paused">Paused</TabsTrigger>
                <TabsTrigger value="private">Private</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </>
            )}
          </TabsList>
        </Tabs>
      </div>

      {/* Search and filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
          <Input
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-12 bg-card/50 border-border/40 rounded-xl focus:border-primary/30 focus:bg-card/80 transition-all duration-200"
          />
        </div>
        <Button 
          variant="outline" 
          className={`h-12 gap-2 rounded-xl border-border/40 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 ${hasActiveFilters ? "border-primary/50 text-primary bg-primary/5" : ""}`}
          onClick={() => setShowFilters(true)}
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-primary text-primary-foreground rounded-full font-bold">!</span>}
        </Button>
      </div>

      {/* Category tabs - Pill style */}
      <div className="mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              selectedCategory === category.id
                ? "bg-gradient-primary text-primary-foreground glow-primary-sm"
                : "bg-card/50 border border-border/30 text-muted-foreground hover:text-foreground hover:border-primary/20 hover:bg-primary/5"
            }`}
          >
            <category.icon className="h-4 w-4" />
            {category.label}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div className="mb-4 text-sm text-muted-foreground/60">
        {isLoading ? "Loading..." : `Showing ${filteredCampaigns?.length || 0} campaigns`}
      </div>

      {/* Campaign grid - Virality.gg inspired cards */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-[360px] rounded-2xl" />
          ))}
        </div>
      ) : filteredCampaigns?.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No campaigns found"
          description={searchQuery || hasActiveFilters ? "Try adjusting your filters" : "Check back later for new campaigns"}
          variant="gradient"
          action={
            (searchQuery || hasActiveFilters)
              ? { label: "Clear Filters", onClick: () => { setSearchQuery(""); setFilters({ platforms: [], minRate: 0, maxRate: 500, minViews: 0 }); } }
              : undefined
          }
        />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5 stagger-enter">
          {filteredCampaigns?.map((campaign) => (
            <Link
              key={campaign.id}
              to={`/campaigns/${campaign.id}`}
              className="group block rounded-2xl bg-card/60 border border-border/30 overflow-hidden transition-all duration-300 hover:border-primary/20 hover:shadow-[0_8px_40px_hsl(0_0%_0%/0.3),0_0_20px_hsl(267_89%_59%/0.08)] hover:-translate-y-1"
            >
              {/* Campaign Image */}
              <div className="relative w-full h-44 bg-secondary/30 overflow-hidden">
                {campaign.image_url ? (
                  <img 
                    src={campaign.image_url} 
                    alt={campaign.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/3">
                    <ImageIcon className="h-10 w-10 text-muted-foreground/20" />
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                  <Badge className={`${getStatusColor(campaign.status)} flex items-center gap-1.5 text-xs font-semibold backdrop-blur-sm`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${campaign.status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-current'}`} />
                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                  </Badge>
                </div>

                {/* Platform Icons */}
                {campaign.platforms && campaign.platforms.length > 0 && (
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    {campaign.platforms.map((platform) => (
                      <div key={platform} className="w-7 h-7 rounded-lg bg-background/80 backdrop-blur-sm flex items-center justify-center transition-transform duration-200 hover:scale-110">
                        {platformIcons[platform]}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Content */}
              <div className="p-5">
                <div className="mb-3">
                  <h3 className="font-display font-bold text-lg group-hover:text-primary transition-colors duration-200 line-clamp-1">
                    {campaign.name}
                  </h3>
                  {campaign.niche && (
                    <span className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-md bg-secondary/50 text-muted-foreground capitalize">
                      {campaign.niche}
                    </span>
                  )}
                </div>

                <p className="text-sm text-muted-foreground/60 mb-4 line-clamp-2">
                  {campaign.description || "No description provided"}
                </p>

                {/* Rate & Views - Inline */}
                <div className="flex items-center gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-primary/60" />
                    <span className="font-bold text-primary">${campaign.rate_value}</span>
                    <span className="text-muted-foreground/50">RPM</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground/60">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{formatNumber(campaign.min_views)} min</span>
                  </div>
                </div>

                {/* Budget Progress - Virality.gg style */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-muted-foreground/50 mb-1.5">
                    <span className="font-semibold text-foreground/80">${Number(campaign.spent_budget).toLocaleString()}</span>
                    <span>/ ${Number(campaign.total_budget).toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-primary rounded-full transition-all duration-700"
                      style={{ width: `${Math.min((Number(campaign.spent_budget) / Number(campaign.total_budget)) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {campaign.max_earnings_per_post && (
                  <p className="text-xs text-muted-foreground/40">
                    Max ${campaign.max_earnings_per_post} per post
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      <CampaignFiltersModal open={showFilters} onOpenChange={setShowFilters} onApply={setFilters} currentFilters={filters} />
    </AppLayout>
  );
};

export default Campaigns;
