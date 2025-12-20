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
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const categories = [
  { id: "all", label: "All", icon: Sparkles },
  { id: "gaming", label: "Gaming", icon: Gamepad2 },
  { id: "fitness", label: "Fitness", icon: Dumbbell },
  { id: "tech", label: "Tech", icon: Laptop },
  { id: "music", label: "Music", icon: Music },
  { id: "food", label: "Food", icon: Utensils },
];

const campaigns = [
  {
    id: 1,
    title: "Gaming Highlights Campaign",
    creator: "StreamerX",
    avatar: "SX",
    category: "gaming",
    budget: "$5,000",
    cpm: "$0.20",
    views: "2.4M target",
    deadline: "5 days left",
    clippers: 24,
    description: "Looking for skilled clippers to create highlight reels from my gaming streams. Focus on epic moments and funny fails.",
    status: "hot",
  },
  {
    id: 2,
    title: "Workout Clips Challenge",
    creator: "FitLife",
    avatar: "FL",
    category: "fitness",
    budget: "$3,500",
    cpm: "$0.15",
    views: "1.8M target",
    deadline: "3 days left",
    clippers: 18,
    description: "Create motivational workout clips from our training videos. High energy, inspiring content preferred.",
    status: "urgent",
  },
  {
    id: 3,
    title: "Product Review Clips",
    creator: "TechTalk",
    avatar: "TT",
    category: "tech",
    budget: "$2,800",
    cpm: "$0.25",
    views: "800K target",
    deadline: "7 days left",
    clippers: 12,
    description: "Turn our detailed tech reviews into snappy, shareable clips. Focus on key features and honest opinions.",
    status: "new",
  },
  {
    id: 4,
    title: "Music Video Shorts",
    creator: "BeatMaker",
    avatar: "BM",
    category: "music",
    budget: "$4,200",
    cpm: "$0.18",
    views: "1.5M target",
    deadline: "10 days left",
    clippers: 8,
    description: "Create viral-worthy clips from our music videos. Creative edits and transitions encouraged.",
    status: "new",
  },
  {
    id: 5,
    title: "Cooking Show Highlights",
    creator: "ChefMaster",
    avatar: "CM",
    category: "food",
    budget: "$1,800",
    cpm: "$0.12",
    views: "600K target",
    deadline: "14 days left",
    clippers: 5,
    description: "Extract the best moments from our cooking tutorials. Recipe reveals and cooking tips preferred.",
    status: "new",
  },
  {
    id: 6,
    title: "Esports Tournament Clips",
    creator: "ProLeague",
    avatar: "PL",
    category: "gaming",
    budget: "$8,000",
    cpm: "$0.22",
    views: "4M target",
    deadline: "2 days left",
    clippers: 45,
    description: "Capture the most intense moments from our esports tournaments. Clutch plays and team celebrations.",
    status: "hot",
  },
];

const Campaigns = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesCategory = selectedCategory === "all" || campaign.category === selectedCategory;
    const matchesSearch = campaign.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         campaign.creator.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
        Showing {filteredCampaigns.length} campaigns
      </div>

      {/* Campaign grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCampaigns.map((campaign) => (
          <div
            key={campaign.id}
            className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-semibold text-primary-foreground">
                  {campaign.avatar}
                </div>
                <div>
                  <div className="font-medium">{campaign.creator}</div>
                  <div className="text-xs text-muted-foreground">Campaign Creator</div>
                </div>
              </div>
              <Badge 
                variant="secondary"
                className={`text-xs ${
                  campaign.status === "hot" 
                    ? "bg-primary/10 text-primary border-primary/20" 
                    : campaign.status === "urgent"
                    ? "bg-red-500/10 text-red-400 border-red-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                }`}
              >
                {campaign.status === "hot" ? "🔥 Hot" : campaign.status === "urgent" ? "⚡ Urgent" : "✨ New"}
              </Badge>
            </div>

            {/* Title & Description */}
            <h3 className="font-semibold text-lg mb-2">{campaign.title}</h3>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {campaign.description}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                  <DollarSign className="w-3 h-3" />
                  Budget
                </div>
                <div className="font-semibold text-primary">{campaign.budget}</div>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                  <Eye className="w-3 h-3" />
                  CPM Rate
                </div>
                <div className="font-semibold">{campaign.cpm}</div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-border mb-4">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {campaign.deadline}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {campaign.clippers} clippers
                </span>
              </div>
            </div>

            {/* CTA */}
            <Button className="w-full bg-gradient-primary hover:opacity-90 glow-primary">
              Join Campaign
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </AppLayout>
  );
};

export default Campaigns;