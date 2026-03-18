import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useMyAssignedCampaigns() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["campaign-assignments", "my", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: assignments, error: assignError } = await supabase
        .from("campaign_assignments")
        .select("campaign_id")
        .eq("user_id", user.id);

      if (assignError) throw assignError;
      if (!assignments?.length) return [];

      const campaignIds = assignments.map((a: any) => a.campaign_id);

      const { data: campaigns, error: campError } = await supabase
        .from("campaigns")
        .select("*")
        .in("id", campaignIds);

      if (campError) throw campError;
      return campaigns || [];
    },
    enabled: !!user,
  });
}

export function useCampaignAssignments(campaignId?: string) {
  const { role } = useAuth();

  return useQuery({
    queryKey: ["campaign-assignments", "campaign", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_assignments")
        .select("*")
        .eq("campaign_id", campaignId!);

      if (error) throw error;
      return data || [];
    },
    enabled: !!campaignId && (role === "admin" || role === "platform_admin"),
  });
}

export function useAssignCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ campaignId, userId }: { campaignId: string; userId: string }) => {
      const { data, error } = await supabase
        .from("campaign_assignments")
        .insert({ campaign_id: campaignId, user_id: userId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-assignments"] });
    },
  });
}

export function useUnassignCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ campaignId, userId }: { campaignId: string; userId: string }) => {
      const { error } = await supabase
        .from("campaign_assignments")
        .delete()
        .eq("campaign_id", campaignId)
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaign-assignments"] });
    },
  });
}
