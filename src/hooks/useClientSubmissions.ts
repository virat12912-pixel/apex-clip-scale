import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ClientCampaignParticipant {
  creator_id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string;
  total_views: number;
  total_earnings: number;
  submission_count: number;
  approved_count: number;
  rejected_count: number;
  pending_count: number;
}

export function useClientCampaignParticipants(campaignId: string) {
  const { role } = useAuth();
  const isClient = role === "client_admin" || role === "client_manager" || role === "client_viewer";

  return useQuery({
    queryKey: ["client_campaign_participants", campaignId],
    queryFn: async () => {
      const { data: submissions, error } = await supabase
        .from("submissions")
        .select(`
          creator_id,
          views,
          earnings,
          status,
          creator_profile:profiles!submissions_creator_id_fkey(
            id, email, full_name, avatar_url
          )
        `)
        .eq("campaign_id", campaignId);

      if (error) throw error;

      const participantMap = new Map<string, ClientCampaignParticipant>();

      submissions?.forEach((sub: any) => {
        const profile = sub.creator_profile;
        const existing = participantMap.get(sub.creator_id);
        const isApproved = sub.status === "approved" || sub.status === "paid";
        const isRejected = sub.status === "rejected";
        const isPending = sub.status === "pending";

        if (existing) {
          if (isApproved) {
            existing.total_views += Number(sub.views) || 0;
            existing.total_earnings += Number(sub.earnings) || 0;
            existing.approved_count += 1;
          } else if (isRejected) {
            existing.rejected_count += 1;
          } else if (isPending) {
            existing.pending_count += 1;
          }
          existing.submission_count += 1;
        } else {
          participantMap.set(sub.creator_id, {
            creator_id: sub.creator_id,
            full_name: profile?.full_name || null,
            avatar_url: profile?.avatar_url || null,
            email: profile?.email || "",
            total_views: isApproved ? Number(sub.views) || 0 : 0,
            total_earnings: isApproved ? Number(sub.earnings) || 0 : 0,
            submission_count: 1,
            approved_count: isApproved ? 1 : 0,
            rejected_count: isRejected ? 1 : 0,
            pending_count: isPending ? 1 : 0,
          });
        }
      });

      return Array.from(participantMap.values()).sort(
        (a, b) => b.total_views - a.total_views
      );
    },
    enabled: isClient && !!campaignId,
  });
}

export function useClientUserSubmissions(userId: string, campaignId: string) {
  const { role } = useAuth();
  const isClient = role === "client_admin" || role === "client_manager" || role === "client_viewer";

  return useQuery({
    queryKey: ["client_user_submissions", userId, campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select(`
          id, campaign_id, creator_id, clip_url, platform, views, likes, comments,
          earnings, status, created_at, updated_at, submitted_views,
          campaign:campaigns(id, name, rate_value, rate_unit)
        `)
        .eq("creator_id", userId)
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isClient && !!userId && !!campaignId,
  });
}
