import { AppLayout } from "@/components/app/AppLayout";
import { 
  DollarSign, 
  Eye, 
  Film, 
  TrendingUp, 
  ArrowUpRight,
  ArrowRight,
  Clock,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const stats = [
  {
    label: "Total Earnings",
    value: "$2,847.50",
    change: "+12.5%",
    changeType: "positive" as const,
    icon: DollarSign,
  },
  {
    label: "Total Views",
    value: "1.2M",
    change: "+8.2%",
    changeType: "positive" as const,
    icon: Eye,
  },
  {
    label: "Clips Created",
    value: "47",
    change: "+3",
    changeType: "positive" as const,
    icon: Film,
  },
  {
    label: "Active Campaigns",
    value: "5",
    change: "2 new",
    changeType: "neutral" as const,
    icon: TrendingUp,
  },
];

const recentActivity = [
  {
    type: "earning",
    title: "Earned $45.00",
    description: "Gaming Highlights Campaign",
    time: "2 hours ago",
    icon: DollarSign,
    iconBg: "bg-emerald-500/10 text-emerald-400",
  },
  {
    type: "clip",
    title: "Clip approved",
    description: "TechTalk Product Review",
    time: "5 hours ago",
    icon: CheckCircle,
    iconBg: "bg-primary/10 text-primary",
  },
  {
    type: "view",
    title: "Milestone reached",
    description: "Your clip hit 50K views",
    time: "1 day ago",
    icon: Eye,
    iconBg: "bg-blue-500/10 text-blue-400",
  },
  {
    type: "campaign",
    title: "New campaign available",
    description: "FitLife Workout Challenge",
    time: "2 days ago",
    icon: TrendingUp,
    iconBg: "bg-purple-500/10 text-purple-400",
  },
];

const activeCampaigns = [
  {
    name: "Gaming Highlights",
    creator: "StreamerX",
    progress: 75,
    earned: "$180.00",
    deadline: "3 days left",
  },
  {
    name: "Tech Review Clips",
    creator: "TechTalk",
    progress: 40,
    earned: "$95.00",
    deadline: "5 days left",
  },
  {
    name: "Fitness Motivation",
    creator: "FitLife",
    progress: 20,
    earned: "$35.00",
    deadline: "7 days left",
  },
];

const Dashboard = () => {
  return (
    <AppLayout title="Dashboard">
      {/* Welcome banner */}
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
        <h2 className="text-2xl font-bold mb-2">Welcome back, John! 👋</h2>
        <p className="text-muted-foreground mb-4">
          You have 3 pending clips to review and 2 new campaigns matching your interests.
        </p>
        <div className="flex gap-3">
          <Button asChild className="bg-gradient-primary hover:opacity-90">
            <Link to="/campaigns">
              Browse Campaigns
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/launch">Launch Campaign</Link>
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                stat.changeType === "positive" 
                  ? "bg-emerald-500/10 text-emerald-400" 
                  : "bg-secondary text-muted-foreground"
              }`}>
                {stat.change}
              </span>
            </div>
            <div className="text-2xl font-bold mb-1">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Active campaigns */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Active Campaigns</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/campaigns" className="text-primary">
                View all
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="space-y-4">
            {activeCampaigns.map((campaign) => (
              <div
                key={campaign.name}
                className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{campaign.name}</h4>
                    <p className="text-sm text-muted-foreground">by {campaign.creator}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-primary">{campaign.earned}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {campaign.deadline}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="relative h-2 bg-background rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-primary rounded-full transition-all"
                    style={{ width: `${campaign.progress}%` }}
                  />
                </div>
                <div className="mt-1 text-xs text-muted-foreground text-right">
                  {campaign.progress}% complete
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="p-6 rounded-xl bg-card border border-border">
          <h3 className="text-lg font-semibold mb-6">Recent Activity</h3>

          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${activity.iconBg}`}>
                  <activity.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{activity.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {activity.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;