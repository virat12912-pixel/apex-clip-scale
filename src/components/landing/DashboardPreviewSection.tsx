import { useScrollReveal } from "@/hooks/useScrollReveal";
import dashboardPreview from "@/assets/dashboard-preview.png";

const DashboardPreviewSection = () => {
  const headerRef = useScrollReveal();
  const frameRef = useScrollReveal();

  return (
    <section className="py-24 sm:py-32 px-4 relative overflow-hidden">
      <div className="container relative max-w-5xl">
        <div ref={headerRef} className="scroll-reveal text-center mb-14">
          <span className="text-primary text-xs font-semibold tracking-[0.2em] uppercase mb-4 block">
            The Platform
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Your <span className="text-gradient">Command Center</span>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto text-sm sm:text-base">
            Track campaigns, earnings, and performance — all in one dashboard.
          </p>
        </div>

        <div
          ref={frameRef}
          className="scroll-reveal glass-card rounded-2xl p-2 sm:p-3 shadow-[0_0_60px_hsl(var(--primary)/0.15)]"
        >
          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/20">
            <div className="w-3 h-3 rounded-full bg-destructive/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
            <div className="flex-1 mx-4">
              <div className="h-5 rounded-full bg-muted/30 max-w-xs mx-auto" />
            </div>
          </div>

          {/* Screenshot */}
          <div className="rounded-b-xl overflow-hidden">
            <img
              src={dashboardPreview}
              alt="Amplify dashboard showing campaign analytics and earnings"
              className="w-full h-auto"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardPreviewSection;
