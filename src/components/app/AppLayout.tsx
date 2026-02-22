import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Menu } from "lucide-react";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background relative">
        {/* Subtle app-wide background glow */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-1/3 w-[600px] h-[400px] bg-primary/[0.03] rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-primary/[0.02] rounded-full blur-[120px]" />
        </div>

        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0 relative z-10">
          {/* Top bar - Enhanced with glass + gradient line */}
          <header className="h-16 border-b border-border/50 bg-card/40 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40">
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden hover:bg-secondary/80 transition-colors rounded-lg p-2">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
              {title && (
                <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
              )}
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 p-4 lg:p-6 overflow-auto page-enter">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default AppLayout;
