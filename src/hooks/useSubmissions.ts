import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { mapErrorToUserMessage, logError } from "@/lib/errorMapping";

export interface Submission {
  id: string;
  campaign_id: string;
  creator_id: string;
  clip_url: string;
  platform: "tiktok" | "instagram" | "youtube";
  views: number;
  likes: number;
  comments: number;
  earnings: number;
  status: "pending" | "approved" | "rejected" | "paid";
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  submitted_views?: number;
  campaign?: {
    name: string;
    rate_value: number;
    rate_unit: number;
  };
  creator_profile?: {
    full_name: string | null;
    email: string;
  };
}

export function useMySubmissions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["submissions", "my", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Explicitly exclude admin_notes for security
      const { data, error } = await supabase
        .from("submissions")
        .select(`
          id, campaign_id, creator_id, clip_url, platform, views, earnings, status, created_at, updated_at,
          campaign:campaigns(name, rate_value, rate_unit)
        `)
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Omit<Submission, 'admin_notes'>[];
    },
    enabled: !!user,
  });
}

export function useCampaignSubmissions(campaignId: string) {
  return useQuery({
    queryKey: ["submissions", "campaign", campaignId],
    queryFn: async () => {
      // Explicitly exclude admin_notes for brand users viewing their campaign submissions
      const { data, error } = await supabase
        .from("submissions")
        .select(`
          id, campaign_id, creator_id, clip_url, platform, views, earnings, status, created_at, updated_at,
          creator_profile:profiles!submissions_creator_id_fkey(full_name, email)
        `)
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Omit<Submission, 'admin_notes'>[];
    },
    enabled: !!campaignId,
  });
}

export function useAllSubmissions() {
  const { role } = useAuth();
  
  return useQuery({
    queryKey: ["submissions", "all"],
    queryFn: async () => {
      // Client-side role check before API call
      if (role !== "admin") {
        throw new Error("Unauthorized");
      }

      const { data, error } = await supabase
        .from("submissions")
        .select(`
          *,
          campaign:campaigns(name, rate_value, rate_unit),
          creator_profile:profiles!submissions_creator_id_fkey(full_name, email)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        logError("useAllSubmissions", error);
        throw new Error(mapErrorToUserMessage(error));
      }
      return data as Submission[];
    },
    enabled: role === "admin",
  });
}

async function fetchViewsForPlatform(clipUrl: string, platform: string): Promise<number> {
  if (platform !== "tiktok" && platform !== "instagram") {
    return 0;
  }

  const functionName = platform === "instagram" ? "fetch-instagram-views" : "fetch-tiktok-views";
  
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: { video_url: clipUrl },
    });

    if (error || data?.success === false) {
      console.log(`Could not fetch views for ${platform}:`, error || data?.error_code);
      return 0;
    }

    return Number(data?.play_count ?? 0);
  } catch (err) {
    console.error(`Error fetching ${platform} views:`, err);
    return 0;
  }
}

export function useCreateSubmission() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (submissions: {
      campaign_id: string;
      clip_url: string;
      platform: "tiktok" | "instagram" | "youtube";
    }[]) => {
      if (!user) throw new Error("Not authenticated");

      // Insert submissions first
      const submissionsWithCreator = submissions.map(s => ({
        ...s,
        creator_id: user.id,
        submitted_views: 0,
      }));

      const { data: insertedSubmissions, error } = await supabase
        .from("submissions")
        .insert(submissionsWithCreator)
        .select();

      if (error) throw error;

      // Fetch views for each submission in background and update
      for (const sub of insertedSubmissions) {
        const views = await fetchViewsForPlatform(sub.clip_url, sub.platform);
        if (views > 0) {
          await supabase
            .from("submissions")
            .update({ submitted_views: views })
            .eq("id", sub.id);
        }
      }

      return insertedSubmissions;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
    },
  });
}

export function useUpdateSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Submission> & { id: string }) => {
      const { data, error } = await supabase
        .from("submissions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
    },
  });
}
