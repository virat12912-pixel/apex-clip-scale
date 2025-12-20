import { LayoutDashboard, Search, Rocket, User, DollarSign, LogOut, Shield, Settings, Building2, FileText, Wallet } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export function AppSidebar() {
  const { state } = useSidebar();
  const { profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const isCollapsed = state === "collapsed";

  const mainNavItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Browse Campaigns", url: "/campaigns", icon: Search },
    // Brands and admins can launch campaigns
    ...((role === "admin" || role === "brand") ? [{ title: "Launch Campaign", url: "/launch", icon: Rocket }] : []),
  ];

  const accountNavItems = [
    { title: "My Profile", url: "/profile", icon: User },
    { title: "Earnings", url: "/earnings", icon: DollarSign },
    { title: "Settings", url: "/settings", icon: Settings },
  ];

  const adminNavItems = role === "admin" ? [
    { title: "Admin Panel", url: "/admin", icon: Shield },
    { title: "Submissions", url: "/admin/submissions", icon: FileText },
    { title: "Payouts", url: "/admin/payouts", icon: Wallet },
    { title: "Brand Applications", url: "/admin/brands", icon: Building2 },
  ] : [];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <Sidebar className="border-r border-border bg-card">
      <SidebarHeader className="p-4 border-b border-border">
        <NavLink to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">A</span>
          </div>
          {!isCollapsed && <span className="font-bold text-lg">Apex</span>}
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
              <div className="text-sm font-medium truncate">{profile?.full_name || "User"}</div>
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
