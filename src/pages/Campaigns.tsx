import { useState } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { 
  Search, 
  Filter, 
  DollarSign, 
  Eye, 
  ArrowRight,
  Gamepad2,
  Dumbbell,
  Laptop,
  Music,
  Utensils,
  Sparkles,
  AlertCircle,
  Smartphone,
  Camera,
  Play,
  ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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
  tiktok: <Smartphone className="h-3 w-3" />,
  instagram: <Camera className="h-3 w-3" />,
  youtube: <Play className="h-3 w-3" />,
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

  const effectiveStatus = isAdmin ? statusFilter : "active";

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
    if (campaign.rate_value < filters.minRate || campaign.rate_value > filters.maxRate) {
      return false;
    }
    if (filters.minViews > 0 && campaign.min_views > filters.minViews) {
      return false;
    }
    return true;
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const getStatusColor = (status: CampaignStatus) => {
    switch (status) {
      case "active":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "paused":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "completed":
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
      case "private":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      default:
        return "bg-primary/10 text-primary border-primary/20";
    }
  };

  const hasActiveFilters = filters.platforms.length > 0 || filters.minRate > 0 || filters.maxRate < 500 || filters.minViews > 0;

  return (
    <AppLayout title="Browse Campaigns">
      {/* Status Tabs - Admin Only */}
      {isAdmin && (
        <div className="mb-6">
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as CampaignStatus | "all")}>
            <TabsList className="bg-secondary/30 border border-border/50">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="paused">Paused</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="private">Private</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Search and filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 bg-card/50 border-border/50 input-focus-glow transition-all duration-300"
          />
        </div>
        <Button 
          variant="outline" 
          className={`h-12 gap-2 border-border/50 transition-all duration-300 hover:border-primary/30 hover:bg-primary/5 ${hasActiveFilters ? "border-primary text-primary shadow-[0_0_15px_hsl(var(--primary)/0.1)]" : ""}`}
          onClick={() => setShowFilters(true)}
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">!</span>}
        </Button>
      </div>

      {/* Category tabs */}
      <div className="mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
              selectedCategory === category.id
                ? "bg-primary text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.3)]"
                : "bg-card/50 border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5"
            }`}
          >
            <category.icon className="h-4 w-4" />
            {category.label}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div className="mb-4 text-sm text-muted-foreground">
        {isLoading ? "Loading..." : `Showing ${filteredCampaigns?.length || 0} campaigns`}
      </div>

      {/* Campaign grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-2xl" />
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
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 stagger-enter">
          {filteredCampaigns?.map((campaign) => (
            <div
              key={campaign.id}
              className="group rounded-2xl bg-card/50 border border-border/50 overflow-hidden transition-all duration-500 hover:border-primary/30 hover:shadow-[0_8px_40px_hsl(0_0%_0%/0.3),0_0_20px_hsl(var(--primary)/0.08)] hover:-translate-y-1"
            >
              {/* Campaign Image */}
              <div className="relative w-full h-40 bg-secondary/30 overflow-hidden">
                {campaign.image_url ? (
                  <img 
                    src={campaign.image_url} 
                    alt={campaign.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-transparent">
                    <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                )}
                
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                  <Badge className={`${getStatusColor(campaign.status)} flex items-center gap-1 backdrop-blur-sm`}>
                    <Sparkles className="h-3 w-3" />
                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                  </Badge>
                </div>

                {/* Platform Icons */}
                {campaign.platforms && campaign.platforms.length > 0 && (
                  <div className="absolute top-3 right-3 flex gap-1">
                    {campaign.platforms.map((platform) => (
                      <div
                        key={platform}
                        className="w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-primary/20"
                      >
                        {platformIcons[platform]}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6">
                {/* Campaign Name */}
                <div className="mb-3">
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors duration-300 line-clamp-1">
                    {campaign.name}
                  </h3>
                  {campaign.niche && (
                    <Badge variant="secondary" className="mt-1 text-xs capitalize bg-secondary/50">
                      {campaign.niche}
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {campaign.description || "No description provided"}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-secondary/30 border border-border/30 transition-all duration-300 hover:border-primary/20 hover:bg-primary/5">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                      <DollarSign className="w-3 h-3" />Rate
                    </div>
                    <div className="font-semibold text-primary text-sm">${campaign.rate_value}/{formatNumber(campaign.rate_unit)} views</div>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/30 border border-border/30 transition-all duration-300 hover:border-primary/20 hover:bg-primary/5">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                      <Eye className="w-3 h-3" />Min Views
                    </div>
                    <div className="font-semibold text-sm">{formatNumber(campaign.min_views)}</div>
                  </div>
                </div>

                {/* Budget Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Budget Used</span>
                    <span>${Number(campaign.spent_budget).toFixed(0)} / ${Number(campaign.total_budget).toFixed(0)}</span>
                  </div>
                  <Progress 
                    value={Math.min((Number(campaign.spent_budget) / Number(campaign.total_budget)) * 100, 100)} 
                    className="h-1.5"
                  />
                </div>

                {campaign.max_earnings_per_post && (
                  <p className="text-xs text-muted-foreground mb-4">
                    Max ${campaign.max_earnings_per_post} per post
                  </p>
                )}

                <Button asChild className="w-full btn-shimmer bg-gradient-primary hover:opacity-90 transition-all duration-300 hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)] active:scale-[0.98]">
                  <Link to={`/campaigns/${campaign.id}`}>View Campaign<ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CampaignFiltersModal
        open={showFilters}
        onOpenChange={setShowFilters}
        onApply={setFilters}
        currentFilters={filters}
      />
    </AppLayout>
  );
};

export default Campaigns;
