import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface FinalSubmission {
  id: string;
  campaign_id: string;
  user_id: string;
  video_link_1: string;
  video_link_2: string;
  video_link_3: string;
  video_screenshot_1: string | null;
  video_screenshot_2: string | null;
  video_screenshot_3: string | null;
  followers_count: number;
  account_analytics_screenshot: string | null;
  demographics_screenshot: string | null;
  ran_paid_ads: boolean;
  videos_deleted: boolean;
  content_is_original: boolean;
  status: "submitted" | "under_review" | "approved" | "rejected" | "paid";
  tracked_views: number;
  verified_views: number | null;
  final_earnings: number;
  admin_notes: string | null;
  client_payment_received: boolean;
  submitted_at: string;
  reviewed_at: string | null;
  approved_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  campaign?: {
    name: string;
    rate_value: number;
    rate_unit: number;
    status: string;
  };
  creator_profile?: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export interface FinalSubmissionReview {
  id: string;
  final_submission_id: string;
  reviewer_id: string;
  action: string;
  previous_verified_views: number | null;
  new_verified_views: number | null;
  previous_earnings: number | null;
  new_earnings: number | null;
  notes: string | null;
  created_at: string;
}

// Get a user's final submission for a specific campaign
export function useFinalSubmission(campaignId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["final-submission", campaignId, user?.id],
    queryFn: async () => {
      if (!user || !campaignId) return null;
      const { data, error } = await supabase
        .from("final_submissions")
        .select("*")
        .eq("campaign_id", campaignId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as FinalSubmission | null;
    },
    enabled: !!user && !!campaignId,
  });
}

// Get all final submissions for the current user (for earnings page)
export function useMyFinalSubmissions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["final-submissions", "my", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("final_submissions")
        .select(`
          *,
          campaign:campaigns(name, rate_value, rate_unit, status)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as FinalSubmission[];
    },
    enabled: !!user,
  });
}

// Get all final submissions (admin)
export function useAllFinalSubmissions() {
  const { role } = useAuth();

  return useQuery({
    queryKey: ["final-submissions", "all"],
    queryFn: async () => {
      if (role !== "admin") throw new Error("Unauthorized");
      const { data, error } = await supabase
        .from("final_submissions")
        .select(`
          *,
          campaign:campaigns(name, rate_value, rate_unit, status),
          creator_profile:profiles!final_submissions_user_id_fkey(full_name, email, avatar_url)
        `)
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data as FinalSubmission[];
    },
    enabled: role === "admin",
  });
}

// Get review history for a final submission
export function useFinalSubmissionReviews(finalSubmissionId: string) {
  return useQuery({
    queryKey: ["final-submission-reviews", finalSubmissionId],
    queryFn: async () => {
      if (!finalSubmissionId) return [];
      const { data, error } = await supabase
        .from("final_submission_reviews")
        .select("*")
        .eq("final_submission_id", finalSubmissionId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as FinalSubmissionReview[];
    },
    enabled: !!finalSubmissionId,
  });
}

// Create final submission (clipper)
export function useCreateFinalSubmission() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      campaign_id: string;
      video_link_1: string;
      video_link_2: string;
      video_link_3: string;
      video_screenshot_1?: string;
      video_screenshot_2?: string;
      video_screenshot_3?: string;
      followers_count: number;
      account_analytics_screenshot?: string;
      demographics_screenshot?: string;
      ran_paid_ads: boolean;
      videos_deleted: boolean;
      content_is_original: boolean;
      tracked_views: number;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("final_submissions")
        .insert({ ...params, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["final-submission"] });
      queryClient.invalidateQueries({ queryKey: ["final-submissions"] });
    },
  });
}

// Admin: update final submission (approve/reject/adjust)
export function useUpdateFinalSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FinalSubmission> & { id: string }) => {
      const { data, error } = await supabase
        .from("final_submissions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["final-submission"] });
      queryClient.invalidateQueries({ queryKey: ["final-submissions"] });
    },
  });
}

// Admin: add review record
export function useCreateFinalSubmissionReview() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      final_submission_id: string;
      action: string;
      previous_verified_views?: number | null;
      new_verified_views?: number | null;
      previous_earnings?: number | null;
      new_earnings?: number | null;
      notes?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("final_submission_reviews")
        .insert({ ...params, reviewer_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["final-submission-reviews", vars.final_submission_id] });
    },
  });
}

// Upload screenshot to final-submissions bucket
export async function uploadFinalSubmissionScreenshot(
  userId: string,
  campaignId: string,
  file: File,
  label: string
): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  const path = `${userId}/${campaignId}/${label}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("final-submissions")
    .upload(path, file, { upsert: true });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from("final-submissions")
    .getPublicUrl(path);

  return urlData.publicUrl;
}
