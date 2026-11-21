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
    min_payout_views: number | null;
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
          campaign:campaigns(name, rate_value, rate_unit, status, min_payout_views)
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
          campaign:campaigns(name, rate_value, rate_unit, status, min_payout_views),
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
  metricsAssertion?: string;
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
          metricsAssertion: typeof data.metrics_assertion === "string" ? data.metrics_assertion : undefined,
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
        .select("id, status, total_budget, spent_budget, min_views, required_hashtags, required_links")
        .in("id", campaignIds);

      if (campaignError) throw campaignError;

      // Campaign row shape for the gate below (typed — no `any` casts).
      interface CampaignGateRow {
        id: string;
        status: string;
        total_budget: number | null;
        spent_budget: number | null;
        min_views: number | null;
        required_hashtags: string[] | null;
        required_links: string[] | null;
      }

      const campaignMap = new Map(
        (campaigns || []).map((c) => {
          const row = c as unknown as CampaignGateRow;
          return [
            row.id,
            {
              status: row.status,
              total_budget: Number(row.total_budget ?? 0),
              spent_budget: Number(row.spent_budget ?? 0),
              min_views: Number(row.min_views ?? 0),
              required_hashtags: row.required_hashtags ?? null,
              required_links: row.required_links ?? null,
            },
          ] as const;
        }),
      );

      // H-12: gate at insert — only `active` campaigns with budget left
      // accept submissions. Without this, a clip for a paused/completed
      // (or fully spent) campaign inserts a zeroed pending row that
      // process-submission then 409s forever.
      for (const s of submissions) {
        const campaign = campaignMap.get(s.campaign_id);
        if (!campaign) throw new Error("Campaign not found for submission.");
        if (campaign.status !== "active") {
          throw new Error("This campaign is not accepting submissions right now.");
        }
        if (campaign.total_budget - campaign.spent_budget <= 0) {
          throw new Error("This campaign's budget is fully spent.");
        }
      }

      // Pre-validate platforms
      for (const s of submissions) {
        if (s.platform !== "tiktok" && s.platform !== "instagram" && s.platform !== "youtube") {
          throw new Error("Auto-validation currently supports TikTok, Instagram, and YouTube only.");
        }
        if (!campaignMap.get(s.campaign_id)) throw new Error("Campaign not found for submission.");
      }

      // Fetch views SEQUENTIALLY to avoid API rate-limiting returning wrong data
      interface SubmissionInsertRow {
        campaign_id: string;
        clip_url: string;
        platform: "tiktok" | "instagram" | "youtube";
        creator_id: string;
        submitted_views: number;
        views: number;
        earnings: number;
        likes: number;
        comments: number;
        status: "pending";
      }
      const toInsert: SubmissionInsertRow[] = [];
      const fetchedMetrics: Array<{ views: number; likes: number; comments: number; assertion?: string }> = [];
      const profileCache = new Map<string, ProfileLinkData>();
      for (const s of submissions) {
        const campaignReq = campaignMap.get(s.campaign_id);
        if (!campaignReq) throw new Error("Campaign not found for submission.");

        // Add a small delay between API calls to avoid rate limits
        if (toInsert.length > 0) {
          await sleep(1000);
        }

        const clipUrl = s.clip_url.trim();
        const viewData = await fetchViewsForPlatform(clipUrl, s.platform, 3, 2000);

        if (viewData.views <= 0) {
          throw new Error(`Could not fetch views for ${s.clip_url}. Please double-check the URL and try again.`);
        }
        if (!viewData.metricsAssertion) {
          throw new Error("Could not securely verify clip metrics. Please retry the submission.");
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
          clip_url: clipUrl,
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
          assertion: viewData.metricsAssertion,
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
            const { data: processed, error: processError } = await supabase.functions.invoke("process-submission", {
              body: {
                submission_id: sub.id,
                metrics_assertion: metrics.assertion,
              },
            });
            if (processError || !processed?.success) {
              throw processError || new Error(processed?.error || "Submission processing failed");
            }
          } catch (processError) {
            console.error("Failed to process submission:", processError);
            throw new Error("Your clip was saved but could not be processed. Please contact support before submitting it again.");
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

// H-09: restricted to non-money fields only. Money fields (status,
// views, likes, comments, earnings, submitted_views) must NEVER be
// written from the browser — status/earnings move only through the
// accounting Edge Functions (calculate-earnings, reject-submission,
// delete-submission, refresh-views, process-submission).
// H-12: reprocess a zeroed pending row (views=0, earnings=0) instead of
// forcing the creator to re-insert the clip (which duplicates it — see
// H-04). Re-fetches fresh metrics to get a new signed assertion, then
// runs process-submission again for the SAME row. process-submission
// itself re-checks campaign status/budget and rejects already-processed
// rows, so this is safe to offer on any stalled pending row.
export function useReprocessSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      submission_id: string;
      clip_url: string;
      platform: "tiktok" | "instagram" | "youtube";
    }) => {
      const viewData = await fetchViewsForPlatform(params.clip_url.trim(), params.platform, 3, 2000);
      if (viewData.views <= 0) {
        throw new Error("Could not fetch views for this clip. Please double-check the URL is still public and try again.");
      }
      if (!viewData.metricsAssertion) {
        throw new Error("Could not securely verify clip metrics. Please retry.");
      }
      const { data, error } = await supabase.functions.invoke("process-submission", {
        body: {
          submission_id: params.submission_id,
          metrics_assertion: viewData.metricsAssertion,
        },
      });
      if (error) throw error;
      if (data?.success === false) throw new Error(data?.error || "Submission processing failed");
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
    },
  });
}

export function useUpdateSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, admin_notes }: { id: string; admin_notes?: string | null }) => {
      const { data, error } = await supabase
        .from("submissions")
        .update({ admin_notes })
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
