import { useState } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { 
  Search, 
  Filter, 
  DollarSign, 
  Eye, 
  Clock, 
  Users,
  ArrowRight,
  Gamepad2,
  Dumbbell,
  Laptop,
  Music,
  Utensils,
  Sparkles,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { useCampaigns } from "@/hooks/useCampaigns";

const categories = [
  { id: "all", label: "All", icon: Sparkles },
  { id: "gaming", label: "Gaming", icon: Gamepad2 },
  { id: "fitness", label: "Fitness", icon: Dumbbell },
  { id: "tech", label: "Tech", icon: Laptop },
  { id: "music", label: "Music", icon: Music },
  { id: "food", label: "Food", icon: Utensils },
];

const platformIcons: Record<string, string> = {
  tiktok: "📱",
  instagram: "📸",
  youtube: "▶️",
};

const Campaigns = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: campaigns, isLoading } = useCampaigns({
    status: "active",
    niche: selectedCategory === "all" ? undefined : selectedCategory,
    search: searchQuery || undefined,
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  return (
    <AppLayout title="Browse Campaigns">
      {/* Search and filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 bg-card border-border"
          />
        </div>
        <Button variant="outline" className="h-12 gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Category tabs */}
      <div className="mb-8 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === category.id
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
            }`}
          >
            <category.icon className="h-4 w-4" />
            {category.label}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div className="mb-4 text-sm text-muted-foreground">
        {isLoading ? "Loading..." : `Showing ${campaigns?.length || 0} campaigns`}
      </div>

      {/* Campaign grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-2xl" />
          ))}
        </div>
      ) : campaigns?.length === 0 ? (
        <div className="text-center py-16">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No campaigns found</h3>
          <p className="text-muted-foreground">
            {searchQuery 
              ? "Try adjusting your search terms"
              : "Check back later for new campaigns"
            }
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {campaigns?.map((campaign) => (
            <div
              key={campaign.id}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-semibold text-primary-foreground">
                    {campaign.creator_profile?.full_name?.charAt(0) || "C"}
                  </div>
                  <div>
                    <div className="font-medium">
                      {campaign.creator_profile?.full_name || "Creator"}
                    </div>
                    <div className="text-xs text-muted-foreground">Campaign Creator</div>
                  </div>
                </div>
                <Badge 
                  variant="secondary"
                  className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                >
                  ✨ Active
                </Badge>
              </div>

              {/* Title & Description */}
              <h3 className="font-semibold text-lg mb-2">{campaign.name}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {campaign.description || "No description provided"}
              </p>

              {/* Platforms */}
              {campaign.platforms && campaign.platforms.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {campaign.platforms.map((platform) => (
                    <span 
                      key={platform}
                      className="px-2 py-1 rounded bg-secondary text-xs capitalize"
                    >
                      {platformIcons[platform]} {platform}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                    <DollarSign className="w-3 h-3" />
                    Rate
                  </div>
                  <div className="font-semibold text-primary">
                    ${campaign.rate_value}/{formatNumber(campaign.rate_unit)} views
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                    <Eye className="w-3 h-3" />
                    Min Views
                  </div>
                  <div className="font-semibold">{formatNumber(campaign.min_views)}</div>
                </div>
              </div>

              {/* Budget Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Budget Used</span>
                  <span>${Number(campaign.spent_budget).toFixed(0)} / ${Number(campaign.total_budget).toFixed(0)}</span>
                </div>
                <div className="h-2 bg-background rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-primary rounded-full"
                    style={{ width: `${Math.min((Number(campaign.spent_budget) / Number(campaign.total_budget)) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* CTA */}
              <Button asChild className="w-full bg-gradient-primary hover:opacity-90 glow-primary">
                <Link to={`/campaigns/${campaign.id}`}>
                  View Campaign
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default Campaigns;
