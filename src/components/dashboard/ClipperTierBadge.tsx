import { Badge } from "@/components/ui/badge";
import { Star, Shield, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClipperTierBadgeProps {
  tier: string;
  size?: "sm" | "default" | "lg";
  showLabel?: boolean;
}

export function ClipperTierBadge({ tier, size = "default", showLabel = true }: ClipperTierBadgeProps) {
  const config = {
    standard: {
      icon: Star,
      label: "Standard",
      className: "bg-secondary text-muted-foreground border-border"
    },
    verified: {
      icon: Shield,
      label: "Verified",
      className: "bg-blue-500/10 text-blue-400 border-blue-500/20"
    },
    elite: {
      icon: Crown,
      label: "Elite",
      className: "bg-primary/10 text-primary border-primary/20"
    }
  };

  const currentConfig = config[tier as keyof typeof config] || config.standard;
  const Icon = currentConfig.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    default: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5"
  };

  const iconSizes = {
    sm: "h-3 w-3",
    default: "h-4 w-4",
    lg: "h-5 w-5"
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-medium border",
        currentConfig.className,
        sizeClasses[size]
      )}
    >
      <Icon className={cn("mr-1", iconSizes[size])} />
      {showLabel && currentConfig.label}
    </Badge>
  );
}

export default ClipperTierBadge;
