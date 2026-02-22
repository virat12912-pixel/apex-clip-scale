import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden">
      {/* Mesh background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.08),transparent_50%),radial-gradient(ellipse_at_bottom_right,hsl(var(--primary)/0.05),transparent_50%)]" />
      
      <div className="text-center relative z-10 page-enter">
        <h1 className="text-8xl font-display font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">404</h1>
        <p className="mb-2 text-2xl font-display font-bold">Page not found</p>
        <p className="mb-8 text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
        <Button asChild className="bg-gradient-primary hover:opacity-90 rounded-xl font-display font-bold btn-shimmer glow-primary-sm">
          <Link to="/">Return Home</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
