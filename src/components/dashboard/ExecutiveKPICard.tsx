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
    default: "from-secondary/50 to-secondary/20 border-border/50",
    primary: "from-primary/15 to-primary/5 border-primary/20",
    success: "from-emerald-500/15 to-emerald-500/5 border-emerald-500/20",
    warning: "from-amber-500/15 to-amber-500/5 border-amber-500/20",
    danger: "from-red-500/15 to-red-500/5 border-red-500/20"
  };

  const iconStyles = {
    default: "bg-muted/50 text-muted-foreground",
    primary: "bg-primary/15 text-primary",
    success: "bg-emerald-500/15 text-emerald-400",
    warning: "bg-amber-500/15 text-amber-400",
    danger: "bg-red-500/15 text-red-400"
  };

  const glowColors = {
    default: "bg-muted",
    primary: "bg-primary",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-red-500"
  };

  return (
    <div className={cn(
      "relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br border",
      variantStyles[variant],
      "transition-all duration-500 hover:scale-[1.03] hover:shadow-xl group"
    )}>
      {/* Background glow effect - animated */}
      <div className={cn(
        "absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-20 transition-all duration-500 group-hover:opacity-40 group-hover:scale-125",
        glowColors[variant]
      )} />
      
      {/* Subtle bottom gradient line */}
      <div className={cn(
        "absolute bottom-0 left-4 right-4 h-[2px] rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100",
        variant === "primary" && "bg-gradient-to-r from-transparent via-primary to-transparent",
        variant === "success" && "bg-gradient-to-r from-transparent via-emerald-400 to-transparent",
        variant === "warning" && "bg-gradient-to-r from-transparent via-amber-400 to-transparent",
        variant === "danger" && "bg-gradient-to-r from-transparent via-red-400 to-transparent",
        variant === "default" && "bg-gradient-to-r from-transparent via-muted-foreground/30 to-transparent",
      )} />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "p-3 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg",
            iconStyles[variant]
          )}>
            <Icon className="h-6 w-6" />
          </div>
          {trend && (
            <span className={cn(
              "text-xs font-bold px-2.5 py-1.5 rounded-full transition-all duration-300",
              trend.positive 
                ? "bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20" 
                : "bg-red-500/10 text-red-400 group-hover:bg-red-500/20"
            )}>
              {trend.positive ? "↑" : "↓"} {trend.value}
            </span>
          )}
        </div>
        
        <div className="text-3xl font-display font-bold mb-1 tracking-tight">{value}</div>
        <div className="text-sm text-muted-foreground/80">{label}</div>
        {subValue && (
          <div className="text-xs text-muted-foreground/50 mt-1.5">{subValue}</div>
        )}
      </div>
    </div>
  );
}

export default ExecutiveKPICard;
