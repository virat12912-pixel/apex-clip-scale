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
          {/* Top bar - Enhanced with glass effect */}
          <header className="h-16 border-b border-border bg-card/60 backdrop-blur-md flex items-center justify-between px-4 lg:px-6 sticky top-0 z-40">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden hover:bg-secondary/80 transition-colors rounded-lg p-2">
                <Menu className="h-5 w-5" />
              </SidebarTrigger>
              {title && (
                <h1 className="text-xl font-semibold">{title}</h1>
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