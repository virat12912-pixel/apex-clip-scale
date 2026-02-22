import { LayoutDashboard, Search, Rocket, User, DollarSign, LogOut, Shield, Settings, Building2, FileText, Wallet, Smartphone, Users, Zap, BarChart3, Crown } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ClipperTierBadge } from "@/components/dashboard/ClipperTierBadge";

export function AppSidebar() {
  const { state } = useSidebar();
  const { profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const isCollapsed = state === "collapsed";

  const hasAdminAccess = role === "admin" || role === "platform_admin";
  const canLaunchCampaigns = hasAdminAccess || role === "brand" || role === "client_admin";
  const isClipperRole = role === "creator" || role === "clipper";

  const mainNavItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Browse Campaigns", url: "/campaigns", icon: Search },
    ...(canLaunchCampaigns ? [{ title: "Launch Campaign", url: "/launch", icon: Rocket }] : []),
  ];

  const accountNavItems = [
    { title: "My Profile", url: "/profile", icon: User },
    { title: "Earnings", url: "/earnings", icon: DollarSign },
    { title: "Social Accounts", url: "/social-accounts", icon: Smartphone },
    { title: "Settings", url: "/settings", icon: Settings },
  ];

  const adminNavItems = hasAdminAccess ? [
    { title: "Admin Panel", url: "/admin", icon: Shield },
    { title: "Submissions", url: "/admin/submissions", icon: FileText },
    { title: "Payouts", url: "/admin/payouts", icon: Wallet },
    { title: "Brand Applications", url: "/admin/brands", icon: Building2 },
    { title: "Verify Accounts", url: "/admin/social-accounts", icon: Users },
  ] : [];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const renderNavItem = (item: { title: string; url: string; icon: any }) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild>
        <NavLink 
          to={item.url} 
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-primary/5 hover:text-foreground transition-all duration-300 group relative" 
          activeClassName="bg-primary/10 text-primary shadow-[0_0_20px_hsl(var(--primary)/0.1)]"
        >
          <item.icon className="h-5 w-5 flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_6px_hsl(var(--primary)/0.4)]" />
          {!isCollapsed && <span className="transition-colors duration-200">{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar className="border-r border-border/50 bg-card/60 backdrop-blur-xl">
      {/* Gradient accent line */}
      <div className="absolute top-0 right-0 bottom-0 w-px bg-gradient-to-b from-primary/20 via-transparent to-primary/10" />
      
      <SidebarHeader className="p-4 border-b border-border/50">
        <NavLink to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center glow-primary-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_25px_hsl(var(--primary)/0.5)]">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          {!isCollapsed && <span className="font-display font-bold text-lg tracking-tight">Amplify</span>}
        </NavLink>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/60 text-[10px] uppercase tracking-[0.15em] mb-2 font-medium">{!isCollapsed && "Main"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {mainNavItems.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="my-4 mx-3 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/60 text-[10px] uppercase tracking-[0.15em] mb-2 font-medium">{!isCollapsed && "Account"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {accountNavItems.map(renderNavItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {adminNavItems.length > 0 && (
          <>
            <div className="my-4 mx-3 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
            <SidebarGroup>
              <SidebarGroupLabel className="text-muted-foreground/60 text-[10px] uppercase tracking-[0.15em] mb-2 font-medium">{!isCollapsed && "Admin"}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-0.5">
                  {adminNavItems.map(renderNavItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border/50">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5 transition-all duration-300 cursor-pointer group">
          <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 group-hover:shadow-primary/40 group-hover:scale-105">
            {profile?.full_name?.charAt(0) || "U"}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{profile?.full_name || "User"}</span>
                {isClipperRole && (
                  <ClipperTierBadge tier={(profile as any)?.clipper_tier || "standard"} size="sm" showLabel={false} />
                )}
              </div>
              <div className="text-xs text-muted-foreground truncate">{profile?.email}</div>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSignOut} 
            className="w-full mt-3 justify-start text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-300 group"
          >
            <LogOut className="h-4 w-4 mr-2 transition-all duration-300 group-hover:scale-110" />Sign Out
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
