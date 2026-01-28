import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { subDays, format } from "date-fns";

interface DailyAnalytics {
  date: string;
  views: number;
  earnings: number;
  submissions: number;
}

export function useCampaignAnalytics(campaignId?: string, days: number = 30) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["campaign-analytics", campaignId, days],
    queryFn: async (): Promise<DailyAnalytics[]> => {
      if (!campaignId) return [];

      // Get submissions for this campaign within date range
      const startDate = subDays(new Date(), days);
      
      const { data: submissions, error } = await supabase
        .from("submissions")
        .select("views, earnings, status, created_at")
        .eq("campaign_id", campaignId)
        .gte("created_at", startDate.toISOString());

      if (error) throw error;

      // Group by date
      const dailyData = new Map<string, DailyAnalytics>();
      
      // Initialize all days
      for (let i = 0; i < days; i++) {
        const date = format(subDays(new Date(), days - 1 - i), "yyyy-MM-dd");
        dailyData.set(date, { date, views: 0, earnings: 0, submissions: 0 });
      }

      // Aggregate submissions
      for (const sub of submissions || []) {
        const date = format(new Date(sub.created_at), "yyyy-MM-dd");
        const existing = dailyData.get(date);
        if (existing) {
          existing.views += sub.views || 0;
          existing.earnings += Number(sub.earnings) || 0;
          existing.submissions += 1;
        }
      }

      return Array.from(dailyData.values());
    },
    enabled: !!campaignId && !!user,
  });
}

export function useCreatorAnalytics(days: number = 30) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["creator-analytics", user?.id, days],
    queryFn: async (): Promise<DailyAnalytics[]> => {
      if (!user) return [];

      const startDate = subDays(new Date(), days);
      
      const { data: submissions, error } = await supabase
        .from("submissions")
        .select("views, earnings, status, created_at")
        .eq("creator_id", user.id)
        .gte("created_at", startDate.toISOString());

      if (error) throw error;

      // Group by date
      const dailyData = new Map<string, DailyAnalytics>();
      
      // Initialize all days
      for (let i = 0; i < days; i++) {
        const date = format(subDays(new Date(), days - 1 - i), "yyyy-MM-dd");
        dailyData.set(date, { date, views: 0, earnings: 0, submissions: 0 });
      }

      // Aggregate submissions
      for (const sub of submissions || []) {
        const date = format(new Date(sub.created_at), "yyyy-MM-dd");
        const existing = dailyData.get(date);
        if (existing) {
          if (sub.status === "approved" || sub.status === "paid") {
            existing.views += sub.views || 0;
            existing.earnings += Number(sub.earnings) || 0;
          }
          existing.submissions += 1;
        }
      }

      return Array.from(dailyData.values());
    },
    enabled: !!user,
  });
}

export function usePlatformAnalytics(days: number = 30) {
  return useQuery({
    queryKey: ["platform-analytics", days],
    queryFn: async (): Promise<DailyAnalytics[]> => {
      const startDate = subDays(new Date(), days);
      
      const { data: submissions, error } = await supabase
        .from("submissions")
        .select("views, earnings, status, created_at")
        .gte("created_at", startDate.toISOString());

      if (error) throw error;

      // Group by date
      const dailyData = new Map<string, DailyAnalytics>();
      
      // Initialize all days
      for (let i = 0; i < days; i++) {
        const date = format(subDays(new Date(), days - 1 - i), "yyyy-MM-dd");
        dailyData.set(date, { date, views: 0, earnings: 0, submissions: 0 });
      }

      // Aggregate submissions
      for (const sub of submissions || []) {
        const date = format(new Date(sub.created_at), "yyyy-MM-dd");
        const existing = dailyData.get(date);
        if (existing) {
          if (sub.status === "approved" || sub.status === "paid") {
            existing.views += sub.views || 0;
            existing.earnings += Number(sub.earnings) || 0;
          }
          existing.submissions += 1;
        }
      }

      return Array.from(dailyData.values());
    },
  });
}
