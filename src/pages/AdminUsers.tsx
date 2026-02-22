import { useState } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useChangeUserRole } from "@/hooks/useAdminUsers";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Shield, Search, Users, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ALL_ROLES = [
  { value: "creator", label: "Creator" },
  { value: "brand", label: "Brand" },
  { value: "admin", label: "Admin" },
  { value: "client_admin", label: "Client Admin" },
  { value: "client_manager", label: "Client Manager" },
  { value: "client_viewer", label: "Client Viewer" },
  { value: "clipper", label: "Clipper" },
  { value: "platform_admin", label: "Platform Admin" },
];

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_banned: boolean;
  created_at: string;
  role: string;
}

function useAllUsersWithRoles() {
  const { role } = useAuth();

  return useQuery({
    queryKey: ["admin_all_users_with_roles"],
    queryFn: async () => {
      // Fetch profiles and roles in parallel
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("id, email, full_name, avatar_url, is_banned, created_at").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;

      const roleMap = new Map<string, string>();
      rolesRes.data?.forEach((r) => roleMap.set(r.user_id, r.role));

      return (profilesRes.data || []).map((p) => ({
        ...p,
        role: roleMap.get(p.id) || "creator",
      })) as UserWithRole[];
    },
    enabled: role === "admin",
  });
}

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case "admin":
    case "platform_admin":
      return "destructive";
    case "brand":
    case "client_admin":
      return "default";
    default:
      return "secondary";
  }
};

const AdminUsers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: users, isLoading } = useAllUsersWithRoles();
  const changeRole = useChangeUserRole();

  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [pendingChange, setPendingChange] = useState<{ userId: string; userName: string; currentRole: string; newRole: string } | null>(null);

  const filteredUsers = users?.filter((u) => {
    const matchesSearch =
      !search ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name || "").toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === "all" || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleRoleSelect = (userId: string, userName: string, currentRole: string, newRole: string) => {
    if (newRole === currentRole) return;
    setPendingChange({ userId, userName, currentRole, newRole });
  };

  const confirmRoleChange = async () => {
    if (!pendingChange) return;
    try {
      await changeRole.mutateAsync({ userId: pendingChange.userId, newRole: pendingChange.newRole });
      queryClient.invalidateQueries({ queryKey: ["admin_all_users_with_roles"] });
      toast({
        title: "Role updated",
        description: `${pendingChange.userName || "User"}'s role changed to ${pendingChange.newRole.replace(/_/g, " ")}`,
      });
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "Failed to change role", variant: "destructive" });
    } finally {
      setPendingChange(null);
    }
  };

  return (
    <AppLayout title="User Management">
      <div className="space-y-6 page-enter">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              All Users
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {users?.length || 0} registered users
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-[160px]">
              <Shield className="h-4 w-4 mr-1" />
              <SelectValue placeholder="Filter role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {ALL_ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Users List */}
        {isLoading ? (
          <div className="space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : filteredUsers?.length === 0 ? (
          <div className="p-12 rounded-xl bg-card border border-border text-center text-muted-foreground">
            No users found
          </div>
        ) : (
          <div className="space-y-2">
            {filteredUsers?.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 rounded-xl bg-card/50 border border-border/30 hover:bg-card/80 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground flex-shrink-0 overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      user.full_name?.charAt(0) || "?"
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {user.full_name || "Anonymous"}
                      </span>
                      {user.is_banned && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                          Banned
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      {user.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs capitalize hidden sm:inline-flex">
                    {user.role.replace(/_/g, " ")}
                  </Badge>
                  <Select
                    value={user.role}
                    onValueChange={(val) =>
                      handleRoleSelect(user.id, user.full_name || user.email, user.role, val)
                    }
                    disabled={changeRole.isPending}
                  >
                    <SelectTrigger className="h-8 w-[140px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value} className="text-xs">
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!pendingChange} onOpenChange={(open) => !open && setPendingChange(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change User Role?</AlertDialogTitle>
            <AlertDialogDescription>
              Change <span className="font-medium text-foreground">{pendingChange?.userName}</span>'s role from{" "}
              <span className="font-medium text-foreground">{pendingChange?.currentRole?.replace(/_/g, " ")}</span> to{" "}
              <span className="font-medium text-primary">{pendingChange?.newRole?.replace(/_/g, " ")}</span>?
              This will immediately affect their access permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange}>
              Confirm Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default AdminUsers;
