import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Database } from "@/integrations/supabase/types";

type CampaignStatus = Database["public"]["Enums"]["campaign_status"];
type PlatformType = Database["public"]["Enums"]["platform_type"];

export interface Campaign {
  id: string;
  created_by: string;
  name: string;
  description: string | null;
  requirements: string | null;
  platforms: PlatformType[];
  niche: string | null;
  rate_value: number;
  rate_unit: number;
  min_views: number;
  max_earnings_per_post: number | null;
  total_budget: number;
  spent_budget: number;
  status: CampaignStatus;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  creator_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function useCampaigns(filters?: { status?: CampaignStatus | "all"; niche?: string; search?: string }) {
  return useQuery({
    queryKey: ["campaigns", filters],
    queryFn: async () => {
      let query = supabase
        .from("campaigns")
        .select(`
          *,
          creator_profile:profiles!campaigns_created_by_fkey(full_name, avatar_url)
        `)
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      if (filters?.niche && filters.niche !== "all") {
        query = query.eq("niche", filters.niche);
      }

      if (filters?.search) {
        query = query.ilike("name", `%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Campaign[];
    },
  });
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: ["campaign", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select(`
          *,
          creator_profile:profiles!campaigns_created_by_fkey(full_name, avatar_url)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Campaign;
    },
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (campaign: {
      name: string;
      description?: string;
      requirements?: string;
      platforms: PlatformType[];
      niche?: string;
      rate_value: number;
      rate_unit: number;
      min_views?: number;
      max_earnings_per_post?: number;
      total_budget: number;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("campaigns")
        .insert({
          name: campaign.name,
          description: campaign.description,
          requirements: campaign.requirements,
          platforms: campaign.platforms,
          niche: campaign.niche,
          rate_value: campaign.rate_value,
          rate_unit: campaign.rate_unit,
          min_views: campaign.min_views,
          max_earnings_per_post: campaign.max_earnings_per_post,
          total_budget: campaign.total_budget,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { 
      id: string; 
      name?: string;
      description?: string;
      requirements?: string;
      platforms?: PlatformType[];
      niche?: string;
      rate_value?: number;
      rate_unit?: number;
      min_views?: number;
      max_earnings_per_post?: number;
      total_budget?: number;
      spent_budget?: number;
      status?: CampaignStatus;
      image_url?: string;
    }) => {
      const { data, error } = await supabase
        .from("campaigns")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["campaign", data.id] });
    },
  });
}
