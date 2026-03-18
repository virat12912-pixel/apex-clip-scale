import { DollarSign, Eye, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const campaigns = [
  {
    creator: "StreamerX",
    avatar: "SX",
    title: "Gaming Highlights Campaign",
    budget: "$5,000",
    cpm: "$0.20",
    views: "2.4M target",
    deadline: "5 days left",
    category: "Gaming",
  },
  {
    creator: "FitLife",
    avatar: "FL",
    title: "Workout Clips Challenge",
    budget: "$3,500",
    cpm: "$0.15",
    views: "1.8M target",
    deadline: "3 days left",
    category: "Fitness",
  },
  {
    creator: "TechTalk",
    avatar: "TT",
    title: "Product Review Clips",
    budget: "$2,800",
    cpm: "$0.25",
    views: "800K target",
    deadline: "7 days left",
    category: "Tech",
  },
];

const CampaignsPreviewSection = () => {
  return (
    <section className="py-20 px-4 relative bg-gradient-dark overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px]" />
      
      <div className="container relative z-10">
        <div className="text-center mb-12">
          <span className="inline-block text-primary text-sm font-semibold tracking-wider uppercase mb-4">
            Active Campaigns
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Browse <span className="text-gradient">Live Opportunities</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Start earning today. Pick a campaign that matches your style and start clipping.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-10">
          {campaigns.map((campaign, index) => (
            <div
              key={campaign.title}
              className="group relative p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300"
            >
              {/* Category badge */}
              <span className="absolute top-4 right-4 text-xs font-medium px-2 py-1 rounded-full bg-secondary text-muted-foreground">
                {campaign.category}
              </span>

              {/* Creator info */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-semibold text-primary-foreground">
                  {campaign.avatar}
                </div>
                <div>
                  <div className="font-medium text-sm">{campaign.creator}</div>
                  <div className="text-xs text-muted-foreground">Campaign Creator</div>
                </div>
              </div>

              {/* Campaign title */}
              <h3 className="font-semibold text-lg mb-4">{campaign.title}</h3>

              {/* Stats grid */}
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
                    CPM
                  </div>
                  <div className="font-semibold">{campaign.cpm}</div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {campaign.deadline}
                </div>
                <span className="text-xs text-muted-foreground">{campaign.views}</span>
              </div>

              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button size="lg" className="bg-gradient-primary hover:opacity-90 transition-opacity glow-primary">
            View All Campaigns
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CampaignsPreviewSection;