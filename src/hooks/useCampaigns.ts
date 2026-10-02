import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Database } from "@/integrations/supabase/types";

export type CampaignStatus = Database["public"]["Enums"]["campaign_status"];
export type PlatformType = Database["public"]["Enums"]["platform_type"];

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
  min_payout_views: number | null;
  max_earnings_per_post: number | null;
  total_budget: number;
  spent_budget: number;
  status: CampaignStatus;
  image_url: string | null;
  duration_days: number | null;
  end_date: string | null;
  required_hashtags: string[] | null;
  required_links: string[] | null;
  created_at: string;
  updated_at: string;
  creator_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

// Budget used shown in the UI only counts accepted (approved/paid) clips.
// Pending clips stay private to the creator until approved.
async function withApprovedSpend<T extends { id: string; spent_budget: number }>(campaigns: T[]): Promise<T[]> {
  if (!campaigns.length) return campaigns;
  const { data } = await supabase
    .from("submissions")
    .select("campaign_id, earnings")
    .in("campaign_id", campaigns.map((c) => c.id))
    .in("status", ["approved", "paid"]);
  const totals = new Map<string, number>();
  (data || []).forEach((s: any) => totals.set(s.campaign_id, (totals.get(s.campaign_id) || 0) + Number(s.earnings || 0)));
  return campaigns.map((c) => ({ ...c, spent_budget: totals.get(c.id) || 0 }));
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
      return withApprovedSpend(data as Campaign[]);
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
      const [c] = await withApprovedSpend([data as Campaign]);
      return c;
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
      min_payout_views?: number;
      max_earnings_per_post?: number;
      total_budget: number;
      duration_days?: number;
      required_hashtags?: string[];
      required_links?: string[];
      image_url?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Calculate end_date if duration_days is provided
      let end_date: string | undefined;
      if (campaign.duration_days) {
        const endDateObj = new Date();
        endDateObj.setDate(endDateObj.getDate() + campaign.duration_days);
        end_date = endDateObj.toISOString();
      }

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
          min_payout_views: campaign.min_payout_views,
          max_earnings_per_post: campaign.max_earnings_per_post,
          total_budget: campaign.total_budget,
          duration_days: campaign.duration_days,
          end_date,
          required_hashtags: campaign.required_hashtags,
          required_links: campaign.required_links,
          image_url: campaign.image_url,
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
      min_payout_views?: number;
      max_earnings_per_post?: number;
      total_budget?: number;
      spent_budget?: number;
      status?: CampaignStatus;
      duration_days?: number;
      end_date?: string;
      required_hashtags?: string[];
      required_links?: string[];
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
