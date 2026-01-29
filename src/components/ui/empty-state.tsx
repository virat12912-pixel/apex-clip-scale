import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: "default" | "gradient" | "minimal";
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      className,
      icon: Icon,
      title,
      description,
      action,
      variant = "default",
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      default: "bg-card border border-border",
      gradient:
        "bg-gradient-to-br from-card via-card to-primary/5 border border-primary/10",
      minimal: "bg-transparent",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl p-12 text-center overflow-hidden",
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {/* Background glow effect */}
        {variant === "gradient" && (
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          </div>
        )}

        <div className="relative z-10 flex flex-col items-center">
          {/* Animated icon container */}
          <div
            className={cn(
              "mb-6 rounded-2xl p-4 transition-all duration-300",
              variant === "gradient"
                ? "bg-primary/10 text-primary shadow-lg shadow-primary/10"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Icon className="h-10 w-10 float" />
          </div>

          <h3 className="text-xl font-semibold mb-2">{title}</h3>
          <p className="text-muted-foreground max-w-sm mb-6">{description}</p>

          {action && (
            <Button
              onClick={action.onClick}
              className="btn-glow bg-primary hover:bg-primary/90"
            >
              {action.label}
            </Button>
          )}
        </div>

        {/* Decorative dots pattern */}
        {variant === "gradient" && (
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--primary) / 0.3) 1px, transparent 0)`,
                backgroundSize: "24px 24px",
              }}
            />
          </div>
        )}
      </div>
    );
  }
);
EmptyState.displayName = "EmptyState";

export { EmptyState };
