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

  // Check if user has admin-level access
  const hasAdminAccess = role === "admin" || role === "platform_admin";
  // Check if user can launch campaigns (brands/admins)
  const canLaunchCampaigns = hasAdminAccess || role === "brand" || role === "client_admin";
  // Check if user is a clipper/creator type
  const isClipperRole = role === "creator" || role === "clipper";

  const mainNavItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Browse Campaigns", url: "/campaigns", icon: Search },
    // Brands, admins, and client admins can launch campaigns
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

  return (
    <Sidebar className="border-r border-border bg-card">
      <SidebarHeader className="p-4 border-b border-border">
        <NavLink to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center glow-primary-sm">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          {!isCollapsed && <span className="font-bold text-lg">Amplify</span>}
        </NavLink>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider mb-2">{!isCollapsed && "Main"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors" activeClassName="bg-primary/10 text-primary">
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider mb-2">{!isCollapsed && "Account"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors" activeClassName="bg-primary/10 text-primary">
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {adminNavItems.length > 0 && (
          <SidebarGroup className="mt-6">
            <SidebarGroupLabel className="text-muted-foreground text-xs uppercase tracking-wider mb-2">{!isCollapsed && "Admin"}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors" activeClassName="bg-primary/10 text-primary">
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-semibold text-primary-foreground">
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
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="w-full mt-3 justify-start text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4 mr-2" />Sign Out
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
