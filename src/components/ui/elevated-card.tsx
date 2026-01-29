import * as React from "react";
import { cn } from "@/lib/utils";

type CardVariant = "default" | "glass" | "gradient" | "spotlight" | "elevated";

interface ElevatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  children: React.ReactNode;
}

const ElevatedCard = React.forwardRef<HTMLDivElement, ElevatedCardProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const cardRef = React.useRef<HTMLDivElement>(null);
    const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });

    React.useImperativeHandle(ref, () => cardRef.current!);

    const handleMouseMove = React.useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (variant !== "spotlight" || !cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      },
      [variant]
    );

    const variantClasses: Record<CardVariant, string> = {
      default: "bg-card border border-border",
      glass: "glass-card",
      gradient: "gradient-border",
      spotlight: "bg-card border border-border",
      elevated: "elevated-card",
    };

    const spotlightStyle =
      variant === "spotlight"
        ? ({
            "--mouse-x": `${mousePosition.x}px`,
            "--mouse-y": `${mousePosition.y}px`,
          } as React.CSSProperties)
        : undefined;

    return (
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        style={spotlightStyle}
        className={cn(
          "rounded-xl text-card-foreground transition-all duration-300",
          variantClasses[variant],
          variant === "spotlight" && "spotlight-card",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ElevatedCard.displayName = "ElevatedCard";

const ElevatedCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
ElevatedCardHeader.displayName = "ElevatedCardHeader";

const ElevatedCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
ElevatedCardTitle.displayName = "ElevatedCardTitle";

const ElevatedCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
ElevatedCardDescription.displayName = "ElevatedCardDescription";

const ElevatedCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
ElevatedCardContent.displayName = "ElevatedCardContent";

const ElevatedCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
ElevatedCardFooter.displayName = "ElevatedCardFooter";

export {
  ElevatedCard,
  ElevatedCardHeader,
  ElevatedCardTitle,
  ElevatedCardDescription,
  ElevatedCardContent,
  ElevatedCardFooter,
};
