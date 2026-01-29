import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionDividerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "gradient" | "dots" | "line" | "fade";
  size?: "sm" | "md" | "lg";
}

const SectionDivider = React.forwardRef<HTMLDivElement, SectionDividerProps>(
  ({ className, variant = "gradient", size = "md", ...props }, ref) => {
    const sizeClasses = {
      sm: "my-4",
      md: "my-8",
      lg: "my-12",
    };

    const renderVariant = () => {
      switch (variant) {
        case "gradient":
          return (
            <div className="relative h-px w-full">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            </div>
          );
        case "dots":
          return (
            <div className="flex items-center justify-center gap-2">
              <div className="h-1 w-1 rounded-full bg-primary/50" />
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <div className="h-1 w-1 rounded-full bg-primary/50" />
            </div>
          );
        case "line":
          return <div className="h-px w-full bg-border" />;
        case "fade":
          return (
            <div className="relative h-8 w-full">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-border/30 to-transparent" />
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <div
        ref={ref}
        className={cn(sizeClasses[size], className)}
        {...props}
      >
        {renderVariant()}
      </div>
    );
  }
);
SectionDivider.displayName = "SectionDivider";

export { SectionDivider };
