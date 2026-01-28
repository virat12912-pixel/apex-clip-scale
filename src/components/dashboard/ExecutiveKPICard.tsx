import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExecutiveKPICardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  subValue?: string;
  trend?: {
    value: string;
    positive: boolean;
  };
  variant?: "default" | "primary" | "success" | "warning" | "danger";
}

export function ExecutiveKPICard({ 
  icon: Icon, 
  label, 
  value, 
  subValue,
  trend,
  variant = "default"
}: ExecutiveKPICardProps) {
  const variantStyles = {
    default: "from-secondary/50 to-secondary/20 border-border",
    primary: "from-primary/20 to-primary/5 border-primary/30",
    success: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30",
    warning: "from-amber-500/20 to-amber-500/5 border-amber-500/30",
    danger: "from-red-500/20 to-red-500/5 border-red-500/30"
  };

  const iconStyles = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary/20 text-primary",
    success: "bg-emerald-500/20 text-emerald-400",
    warning: "bg-amber-500/20 text-amber-400",
    danger: "bg-red-500/20 text-red-400"
  };

  return (
    <div className={cn(
      "relative overflow-hidden p-6 rounded-xl bg-gradient-to-br border",
      variantStyles[variant],
      "transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
    )}>
      {/* Background glow effect */}
      <div className={cn(
        "absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-30",
        variant === "primary" && "bg-primary",
        variant === "success" && "bg-emerald-500",
        variant === "warning" && "bg-amber-500",
        variant === "danger" && "bg-red-500",
        variant === "default" && "bg-muted"
      )} />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={cn("p-3 rounded-xl", iconStyles[variant])}>
            <Icon className="h-6 w-6" />
          </div>
          {trend && (
            <span className={cn(
              "text-sm font-semibold px-2.5 py-1 rounded-full",
              trend.positive 
                ? "bg-emerald-500/10 text-emerald-400" 
                : "bg-red-500/10 text-red-400"
            )}>
              {trend.positive ? "↑" : "↓"} {trend.value}
            </span>
          )}
        </div>
        
        <div className="text-3xl font-bold mb-1 tracking-tight">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
        {subValue && (
          <div className="text-xs text-muted-foreground/70 mt-1">{subValue}</div>
        )}
      </div>
    </div>
  );
}

export default ExecutiveKPICard;
