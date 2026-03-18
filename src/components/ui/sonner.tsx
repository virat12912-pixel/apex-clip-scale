import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:backdrop-blur-sm",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:hover:shadow-[0_0_15px_hsl(var(--primary)/0.3)]",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:border-emerald-500/30 group-[.toaster]:bg-emerald-500/10",
          error: "group-[.toaster]:border-destructive/30 group-[.toaster]:bg-destructive/10",
          warning: "group-[.toaster]:border-amber-500/30 group-[.toaster]:bg-amber-500/10",
          info: "group-[.toaster]:border-primary/30 group-[.toaster]:bg-primary/10",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
