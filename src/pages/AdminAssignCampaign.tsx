import { useState } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useAssignCampaign, useUnassignCampaign } from "@/hooks/useCampaignAssignments";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Link2, Search, Users, Unlink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AssignmentRow {
  id: string;
  campaign_id: string;
  user_id: string;
  created_at: string;
  campaign_name: string;
  user_name: string;
  user_email: string;
}

function useAllAssignments() {
  const { role } = useAuth();

  return useQuery({
    queryKey: ["campaign-assignments", "all"],
    queryFn: async () => {
      const { data: assignments, error } = await supabase
        .from("campaign_assignments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch campaign names and user info
      const campaignIds = [...new Set((assignments || []).map((a: any) => a.campaign_id))];
      const userIds = [...new Set((assignments || []).map((a: any) => a.user_id))];

      const [campaignsRes, profilesRes] = await Promise.all([
        campaignIds.length ? supabase.from("campaigns").select("id, name").in("id", campaignIds) : { data: [], error: null },
        userIds.length ? supabase.from("profiles").select("id, full_name, email").in("id", userIds) : { data: [], error: null },
      ]);

      const campaignMap = new Map((campaignsRes.data || []).map((c: any) => [c.id, c.name]));
      const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.id, { name: p.full_name, email: p.email }]));

      return (assignments || []).map((a: any) => ({
        ...a,
        campaign_name: campaignMap.get(a.campaign_id) || "Unknown",
        user_name: profileMap.get(a.user_id)?.name || "Unknown",
        user_email: profileMap.get(a.user_id)?.email || "",
      })) as AssignmentRow[];
    },
    enabled: role === "admin" || role === "platform_admin",
  });
}

function useClientUsers() {
  const { role } = useAuth();

  return useQuery({
    queryKey: ["admin_client_users"],
    queryFn: async () => {
      // Get all users with client-related roles
      const { data: roles, error: rolesErr } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["client_admin", "client_manager", "client_viewer"]);

      if (rolesErr) throw rolesErr;
      if (!roles?.length) return [];

      const userIds = roles.map((r) => r.user_id);
      const { data: profiles, error: profilesErr } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      if (profilesErr) throw profilesErr;

      const roleMap = new Map(roles.map((r) => [r.user_id, r.role]));
      return (profiles || []).map((p) => ({
        ...p,
        role: roleMap.get(p.id) || "client_viewer",
      }));
    },
    enabled: role === "admin" || role === "platform_admin",
  });
}

const AdminAssignCampaign = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: assignments, isLoading } = useAllAssignments();
  const { data: campaigns } = useCampaigns();
  const { data: clientUsers } = useClientUsers();
  const assignCampaign = useAssignCampaign();
  const unassignCampaign = useUnassignCampaign();

  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [search, setSearch] = useState("");

  const handleAssign = async () => {
    if (!selectedCampaign || !selectedUser) {
      toast({ title: "Select both a campaign and a user", variant: "destructive" });
      return;
    }
    try {
      await assignCampaign.mutateAsync({ campaignId: selectedCampaign, userId: selectedUser });
      queryClient.invalidateQueries({ queryKey: ["campaign-assignments"] });
      toast({ title: "Campaign assigned successfully" });
      setSelectedCampaign("");
      setSelectedUser("");
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to assign", variant: "destructive" });
    }
  };

  const handleUnassign = async (campaignId: string, userId: string) => {
    try {
      await unassignCampaign.mutateAsync({ campaignId, userId });
      queryClient.invalidateQueries({ queryKey: ["campaign-assignments"] });
      toast({ title: "Assignment removed" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to unassign", variant: "destructive" });
    }
  };

  const filteredAssignments = assignments?.filter((a) =>
    !search ||
    a.campaign_name.toLowerCase().includes(search.toLowerCase()) ||
    a.user_name.toLowerCase().includes(search.toLowerCase()) ||
    a.user_email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout title="Assign Campaigns">
      <div className="space-y-6 page-enter">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Link2 className="h-6 w-6 text-primary" />
            Campaign Assignments
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Assign campaigns to client users so they can see them on their dashboard.
          </p>
        </div>

        {/* Assign form */}
        <div className="p-5 rounded-2xl bg-card/50 border border-border/30 space-y-4">
          <h3 className="font-semibold text-sm">New Assignment</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select campaign..." />
              </SelectTrigger>
              <SelectContent>
                {(campaigns || []).map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select client user..." />
              </SelectTrigger>
              <SelectContent>
                {(clientUsers || []).map((u: any) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.full_name || u.email} ({u.role.replace(/_/g, " ")})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAssign} disabled={assignCampaign.isPending} className="bg-gradient-primary">
              <Link2 className="h-4 w-4 mr-2" />
              Assign
            </Button>
          </div>
          {!clientUsers?.length && (
            <p className="text-xs text-muted-foreground">No client users found. Change a user's role to client_admin, client_manager, or client_viewer first.</p>
          )}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search assignments..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : !filteredAssignments?.length ? (
          <div className="p-12 rounded-xl bg-card border border-border text-center text-muted-foreground">
            No campaign assignments yet
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAssignments.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-4 rounded-xl bg-card/50 border border-border/30 hover:bg-card/80 transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="min-w-0">
                    <span className="font-medium text-sm">{a.campaign_name}</span>
                    <div className="text-xs text-muted-foreground">
                      → {a.user_name || "Unknown"} ({a.user_email})
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnassign(a.campaign_id, a.user_id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Unlink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AdminAssignCampaign;
