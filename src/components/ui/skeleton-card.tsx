import * as React from "react";
import { cn } from "@/lib/utils";

interface SkeletonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "stat" | "list-item" | "profile";
}

const SkeletonCard = React.forwardRef<HTMLDivElement, SkeletonCardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const renderContent = () => {
      switch (variant) {
        case "stat":
          return (
            <>
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-xl shimmer" />
                <div className="h-6 w-16 rounded-full shimmer" />
              </div>
              <div className="h-8 w-24 rounded shimmer mb-2" />
              <div className="h-4 w-32 rounded shimmer" />
            </>
          );
        case "list-item":
          return (
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full shimmer" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded shimmer" />
                <div className="h-3 w-1/2 rounded shimmer" />
              </div>
              <div className="h-8 w-20 rounded shimmer" />
            </div>
          );
        case "profile":
          return (
            <div className="flex flex-col items-center text-center">
              <div className="h-24 w-24 rounded-full shimmer mb-4" />
              <div className="h-6 w-32 rounded shimmer mb-2" />
              <div className="h-4 w-48 rounded shimmer mb-4" />
              <div className="flex gap-2">
                <div className="h-8 w-24 rounded shimmer" />
                <div className="h-8 w-24 rounded shimmer" />
              </div>
            </div>
          );
        default:
          return (
            <>
              <div className="h-4 w-1/3 rounded shimmer mb-3" />
              <div className="h-4 w-full rounded shimmer mb-2" />
              <div className="h-4 w-2/3 rounded shimmer mb-4" />
              <div className="h-10 w-full rounded shimmer" />
            </>
          );
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl border border-border bg-card p-6 overflow-hidden",
          className
        )}
        {...props}
      >
        {renderContent()}
      </div>
    );
  }
);
SkeletonCard.displayName = "SkeletonCard";

export { SkeletonCard };
