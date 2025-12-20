import { useState } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Calendar,
  Filter,
  Eye,
  Film,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";

const earningsData = [
  {
    id: 1,
    campaign: "Gaming Highlights Campaign",
    creator: "StreamerX",
    date: "Dec 18, 2024",
    views: "124,500",
    amount: "$24.90",
    status: "paid",
  },
  {
    id: 2,
    campaign: "Workout Clips Challenge",
    creator: "FitLife",
    date: "Dec 16, 2024",
    views: "89,200",
    amount: "$13.38",
    status: "paid",
  },
  {
    id: 3,
    campaign: "Product Review Clips",
    creator: "TechTalk",
    date: "Dec 15, 2024",
    views: "156,800",
    amount: "$39.20",
    status: "paid",
  },
  {
    id: 4,
    campaign: "Music Video Shorts",
    creator: "BeatMaker",
    date: "Dec 14, 2024",
    views: "67,300",
    amount: "$12.11",
    status: "pending",
  },
  {
    id: 5,
    campaign: "Esports Tournament Clips",
    creator: "ProLeague",
    date: "Dec 12, 2024",
    views: "245,000",
    amount: "$53.90",
    status: "paid",
  },
];

const monthlyStats = [
  { month: "Jul", amount: 180 },
  { month: "Aug", amount: 320 },
  { month: "Sep", amount: 290 },
  { month: "Oct", amount: 450 },
  { month: "Nov", amount: 520 },
  { month: "Dec", amount: 680 },
];

const Earnings = () => {
  const [period, setPeriod] = useState("month");

  const maxAmount = Math.max(...monthlyStats.map((s) => s.amount));

  return (
    <AppLayout title="Earnings">
      {/* Stats cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <DollarSign className="h-5 w-5 text-emerald-400" />
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
              <ArrowUpRight className="h-3 w-3" />
              +12.5%
            </span>
          </div>
          <div className="text-2xl font-bold mb-1">$2,847.50</div>
          <div className="text-sm text-muted-foreground">Total Earnings</div>
        </div>

        <div className="p-5 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
              <ArrowUpRight className="h-3 w-3" />
              +8.2%
            </span>
          </div>
          <div className="text-2xl font-bold mb-1">$680.00</div>
          <div className="text-sm text-muted-foreground">This Month</div>
        </div>

        <div className="p-5 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Clock className="h-5 w-5 text-yellow-400" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">$143.49</div>
          <div className="text-sm text-muted-foreground">Pending Payout</div>
        </div>

        <div className="p-5 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Eye className="h-5 w-5 text-blue-400" />
            </div>
          </div>
          <div className="text-2xl font-bold mb-1">$0.19</div>
          <div className="text-sm text-muted-foreground">Avg CPM Earned</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Earnings Overview</h3>
            <div className="flex gap-2">
              {["week", "month", "year"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    period === p
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Simple bar chart */}
          <div className="flex items-end justify-between gap-3 h-48">
            {monthlyStats.map((stat) => (
              <div key={stat.month} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center">
                  <span className="text-xs text-muted-foreground mb-1">
                    ${stat.amount}
                  </span>
                  <div
                    className="w-full bg-gradient-primary rounded-t-lg transition-all hover:opacity-80"
                    style={{ height: `${(stat.amount / maxAmount) * 160}px` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{stat.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payout info */}
        <div className="p-6 rounded-xl bg-card border border-border">
          <h3 className="text-lg font-semibold mb-6">Payout Settings</h3>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-secondary/50">
              <div className="text-sm text-muted-foreground mb-1">Payment Method</div>
              <div className="font-medium">PayPal</div>
              <div className="text-sm text-muted-foreground">john@example.com</div>
            </div>

            <div className="p-4 rounded-lg bg-secondary/50">
              <div className="text-sm text-muted-foreground mb-1">Next Payout</div>
              <div className="font-medium">December 25, 2024</div>
              <div className="text-sm text-muted-foreground">Estimated: $143.49</div>
            </div>

            <div className="p-4 rounded-lg bg-secondary/50">
              <div className="text-sm text-muted-foreground mb-1">Minimum Threshold</div>
              <div className="font-medium">$50.00</div>
            </div>

            <Button variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download Statement
            </Button>
          </div>
        </div>
      </div>

      {/* Earnings history */}
      <div className="mt-6 p-6 rounded-xl bg-card border border-border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Earnings History</h3>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Campaign</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Views</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {earningsData.map((earning) => (
                <tr key={earning.id} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="py-4 px-4">
                    <div className="font-medium">{earning.campaign}</div>
                    <div className="text-sm text-muted-foreground">by {earning.creator}</div>
                  </td>
                  <td className="py-4 px-4 text-sm text-muted-foreground">{earning.date}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5 text-sm">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      {earning.views}
                    </div>
                  </td>
                  <td className="py-4 px-4 font-semibold text-primary">{earning.amount}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      earning.status === "paid"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-yellow-500/10 text-yellow-400"
                    }`}>
                      {earning.status.charAt(0).toUpperCase() + earning.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
};

export default Earnings;