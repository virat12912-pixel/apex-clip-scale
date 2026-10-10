import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { mapErrorToUserMessage, logError } from "@/lib/errorMapping";
import { getMissingCaptionRequirements, isBioLinkRequirementSatisfied, ProfileLinkData } from "@/lib/campaignRequirements";
import { useEffect } from "react";

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
    status: string;
  };
  creator_profile?: {
    full_name: string | null;
    email: string;
  };
}

export function useMySubmissions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Set up realtime subscription for view updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('my-submissions-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'submissions',
          filter: `creator_id=eq.${user.id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["submissions", "my", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return useQuery({
    queryKey: ["submissions", "my", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Explicitly exclude admin_notes for security
      const { data, error } = await supabase
        .from("submissions")
        .select(`
          id, campaign_id, creator_id, clip_url, platform, views, likes, comments, earnings, status, created_at, updated_at,
          campaign:campaigns(name, rate_value, rate_unit, status)
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
          id, campaign_id, creator_id, clip_url, platform, views, likes, comments, earnings, status, created_at, updated_at,
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
  const queryClient = useQueryClient();

  // Set up realtime subscription for admin view updates (all submissions)
  useEffect(() => {
    if (role !== "admin") return;

    const channel = supabase
      .channel('all-submissions-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'submissions'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["submissions", "all"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [role, queryClient]);
  
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
          campaign:campaigns(name, rate_value, rate_unit, status),
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

interface ViewData {
  views: number;
  likes: number;
  comments: number;
  description?: string | null;
  author?: string | null;
}

interface VerifiedAccount {
  platform: string;
  username: string;
  verified: boolean | null;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchViewsForPlatform(
  clipUrl: string,
  platform: string,
  maxRetries = 3,
  retryDelayMs = 1500
): Promise<ViewData> {
  if (platform !== "tiktok" && platform !== "instagram" && platform !== "youtube") {
    return { views: 0, likes: 0, comments: 0, description: null };
  }

  const functionName = platform === "instagram" 
    ? "fetch-instagram-views" 
    : platform === "youtube" 
      ? "fetch-youtube-views" 
      : "fetch-tiktok-views";

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[${platform}] Fetching views, attempt ${attempt}/${maxRetries}...`);
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { video_url: clipUrl },
      });

      if (error) {
        lastError = error;
        console.warn(`[${platform}] Attempt ${attempt} failed:`, error.message);
        if (attempt < maxRetries) {
          await sleep(retryDelayMs * attempt); // Exponential backoff
          continue;
        }
      }

      if (data?.success === false) {
        const errorCode = data?.error_code || "unknown";
        console.warn(`[${platform}] API returned error: ${errorCode}`);
        
        // Don't retry for certain error codes
        if (errorCode === "VIDEO_NOT_FOUND" || errorCode === "PRIVATE_VIDEO") {
          throw new Error(`Video not accessible. Please check the URL is correct and the video is public.`);
        }
        
        if (attempt < maxRetries) {
          await sleep(retryDelayMs * attempt);
          continue;
        }
      }

      if (data?.play_count !== undefined) {
        console.log(`[${platform}] Successfully fetched views: ${data.play_count}, author: ${data.author}`);
        return {
          views: Number(data.play_count ?? 0),
          likes: Number(data.like_count ?? 0),
          comments: Number(data.comment_count ?? 0),
          description: (data.description as string | null | undefined) ?? null,
          author: (data.author as string | null | undefined) ?? null,
        };
      }

      // If we got here with no data, retry
      if (attempt < maxRetries) {
        await sleep(retryDelayMs * attempt);
        continue;
      }
    } catch (err) {
      lastError = err;
      console.error(`[${platform}] Attempt ${attempt} error:`, err);
      
      // Re-throw user-friendly errors immediately
      if (err instanceof Error && err.message.includes("Video not accessible")) {
        throw err;
      }
      
      if (attempt < maxRetries) {
        await sleep(retryDelayMs * attempt);
        continue;
      }
    }
  }

  // All retries exhausted
  console.error(`[${platform}] All ${maxRetries} attempts failed. Last error:`, lastError);
  return { views: 0, likes: 0, comments: 0, description: null, author: null };
}


export function useCreateSubmission() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      submissions: {
        campaign_id: string;
        clip_url: string;
        platform: "tiktok" | "instagram" | "youtube";
      }[];
      verifiedAccounts: VerifiedAccount[];
    }) => {
      const { submissions, verifiedAccounts } = params;
      if (!user) throw new Error("Not authenticated");

      // Fetch campaign requirements once (for validation)
      const campaignIds = [...new Set(submissions.map((s) => s.campaign_id))];
      const { data: campaigns, error: campaignError } = await supabase
        .from("campaigns")
        .select("id, min_views, required_hashtags, required_links")
        .in("id", campaignIds);

      if (campaignError) throw campaignError;

      const campaignMap = new Map(
        (campaigns || []).map((c) => [
          c.id,
          {
            min_views: Number((c as any).min_views ?? 0),
            required_hashtags: ((c as any).required_hashtags as string[] | null) ?? null,
            required_links: ((c as any).required_links as string[] | null) ?? null,
          },
        ]),
      );

      // Pre-validate platforms
      for (const s of submissions) {
        if (s.platform !== "tiktok" && s.platform !== "instagram" && s.platform !== "youtube") {
          throw new Error("Auto-validation currently supports TikTok, Instagram, and YouTube only.");
        }
        if (!campaignMap.get(s.campaign_id)) throw new Error("Campaign not found for submission.");
      }

      // Fetch views SEQUENTIALLY to avoid API rate-limiting returning wrong data
      const toInsert: any[] = [];
      const fetchedMetrics: Array<{ views: number; likes: number; comments: number }> = [];
      const profileCache = new Map<string, ProfileLinkData>();
      for (const s of submissions) {
        const campaignReq = campaignMap.get(s.campaign_id);
        if (!campaignReq) throw new Error("Campaign not found for submission.");

        // Add a small delay between API calls to avoid rate limits
        if (toInsert.length > 0) {
          await sleep(1000);
        }

        const viewData = await fetchViewsForPlatform(s.clip_url, s.platform, 3, 2000);

        if (viewData.views <= 0) {
          throw new Error(`Could not fetch views for ${s.clip_url}. Please double-check the URL and try again.`);
        }

        if (viewData.views < campaignReq.min_views) {
          throw new Error(
            `This campaign requires at least ${campaignReq.min_views.toLocaleString()} views. Your clip currently has ${viewData.views.toLocaleString()} views.`
          );
        }

        if (viewData.author) {
          const normalizedAuthor = viewData.author.toLowerCase().replace(/^@/, '');
          const hasVerifiedAccount = verifiedAccounts.some(
            (a) =>
              a.platform === s.platform &&
              a.verified === true &&
              a.username.toLowerCase().replace(/^@/, '') === normalizedAuthor
          );

          if (!hasVerifiedAccount) {
            const platformName = s.platform.charAt(0).toUpperCase() + s.platform.slice(1);
            throw new Error(
              `The clip is from @${viewData.author}, but you haven't verified this account. Go to Social Accounts to add and verify @${viewData.author} on ${platformName}.`
            );
          }
        } else {
          throw new Error(
            `Could not verify the clip author. Please ensure the video is public and try again.`
          );
        }

        const missingCaption = getMissingCaptionRequirements(viewData.description, campaignReq.required_hashtags);
        if (missingCaption.length) {
          throw new Error(`Missing caption: ${missingCaption.join(", ")}`);
        }

        if (campaignReq.required_links?.length && (s.platform === "tiktok" || s.platform === "instagram")) {
          const linkedAccount = verifiedAccounts.find(
            (account) => account.platform === s.platform && account.verified === true &&
              account.username.toLowerCase().replace(/^@/, "") === viewData.author?.toLowerCase().replace(/^@/, ""),
          );
          if (!linkedAccount) throw new Error("Verify the account that posted this clip before submitting.");

          const cacheKey = `${s.platform}:${linkedAccount.username.toLowerCase()}`;
          let profile = profileCache.get(cacheKey);
          if (!profile) {
            const { data, error } = await supabase.functions.invoke("fetch-social-profile", {
              body: { platform: s.platform, username: linkedAccount.username },
            });
            if (error) throw error;
            if (!data?.success) throw new Error(data?.error || "Could not check the account's profile link.");
            profile = {
              followersCount: typeof data.followers_count === "number" ? data.followers_count : null,
              bioLinks: Array.isArray(data.bio_links) ? data.bio_links.filter((link: unknown): link is string => typeof link === "string") : [],
            };
            profileCache.set(cacheKey, profile);
          }

          if (!isBioLinkRequirementSatisfied(s.platform, campaignReq.required_links, profile)) {
            throw new Error(`Missing bio link: add ${campaignReq.required_links.join(", ")} to your clickable profile link area.`);
          }
        }

        // The INSERT policy only permits creator-owned, zeroed pending rows.
        // Trusted metrics and earnings are applied immediately afterward by
        // process-submission using its server-side credentials.
        toInsert.push({
          ...s,
          creator_id: user.id,
          submitted_views: 0,
          views: 0,
          earnings: 0,
          likes: 0,
          comments: 0,
          status: "pending" as const,
        });
        fetchedMetrics.push({
          views: viewData.views,
          likes: viewData.likes,
          comments: viewData.comments,
        });
      }

      const { data: insertedSubmissions, error } = await supabase
        .from("submissions")
        .insert(toInsert)
        .select();

      if (error) throw error;

      // Process all submissions in parallel for speed
      await Promise.all(
        insertedSubmissions.map(async (sub, index) => {
          const metrics = fetchedMetrics[index];
          if (!metrics) {
            console.error("Missing fetched metrics for submission:", sub.id);
            return;
          }

          try {
            await supabase.functions.invoke("process-submission", {
              body: {
                submission_id: sub.id,
                views: metrics.views,
                likes: metrics.likes,
                comments: metrics.comments,
                set_status: "pending",
              },
            });
          } catch (processError) {
            console.error("Failed to process submission:", processError);
          }
        })
      );

      return insertedSubmissions;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["campaign"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
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

export function useDeleteSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Reverse earnings/budget server-side, then delete
      const { data, error } = await supabase.functions.invoke("delete-submission", {
        body: { submission_id: id },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["campaign"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["campaign-analytics"] });
    },
  });
}
