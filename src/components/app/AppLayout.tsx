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
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar - Glass header with gradient accent */}
          <header className="h-16 border-b border-border/40 bg-card/30 backdrop-blur-xl flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40 relative">
            {/* Subtle gradient line under header */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden hover:bg-primary/10 transition-all duration-200 rounded-lg p-2">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
              {title && (
                <h1 className="text-xl font-display font-bold tracking-tight">{title}</h1>
              )}
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 p-4 lg:p-8 overflow-auto page-enter">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default AppLayout;
