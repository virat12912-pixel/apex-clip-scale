import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CampaignHealthBadgeProps {
  status: string;
  size?: "sm" | "default";
}

export function CampaignHealthBadge({ status, size = "default" }: CampaignHealthBadgeProps) {
  const config = {
    healthy: {
      icon: CheckCircle,
      label: "Healthy",
      className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    },
    needs_attention: {
      icon: AlertTriangle,
      label: "Needs Attention",
      className: "bg-amber-500/10 text-amber-400 border-amber-500/20"
    },
    underperforming: {
      icon: XCircle,
      label: "Underperforming",
      className: "bg-red-500/10 text-red-400 border-red-500/20"
    }
  };

  const currentConfig = config[status as keyof typeof config] || config.healthy;
  const Icon = currentConfig.icon;

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-medium border",
        currentConfig.className,
        size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1"
      )}
    >
      <Icon className={cn("mr-1", size === "sm" ? "h-3 w-3" : "h-4 w-4")} />
      {currentConfig.label}
    </Badge>
  );
}

export default CampaignHealthBadge;
