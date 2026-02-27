import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { Database } from "@/integrations/supabase/types";

type PlatformType = Database["public"]["Enums"]["platform_type"];

export interface SocialAccount {
  id: string;
  user_id: string;
  platform: PlatformType;
  username: string;
  profile_url: string | null;
  verification_code: string;
  verified: boolean;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useMySocialAccounts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["social-accounts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_accounts")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SocialAccount[];
    },
    enabled: !!user,
  });
}

export function useAllSocialAccounts() {
  return useQuery({
    queryKey: ["all-social-accounts"],
    queryFn: async () => {
      // First get all social accounts
      const { data: accounts, error: accountsError } = await supabase
        .from("social_accounts")
        .select("*")
        .order("created_at", { ascending: false });

      if (accountsError) throw accountsError;

      // Then get profiles for each unique user_id
      const userIds = [...new Set(accounts?.map(a => a.user_id) || [])];
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Combine the data
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return (accounts || []).map(account => ({
        ...account,
        profile: profileMap.get(account.user_id) || { full_name: null, email: "" }
      })) as (SocialAccount & { profile: { full_name: string | null; email: string } })[];
    },
  });
}

export function useCreateSocialAccount() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      platform: PlatformType;
      username: string;
      profile_url?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data: account, error } = await supabase
        .from("social_accounts")
        .insert({
          user_id: user.id,
          platform: data.platform,
          username: data.username,
          profile_url: data.profile_url,
        })
        .select()
        .single();

      if (error) throw error;
      return account;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-accounts"] });
    },
  });
}

export function useDeleteSocialAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("social_accounts")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-accounts"] });
    },
  });
}

export function useVerifySocialAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, platform, username, verification_code }: {
      id: string;
      platform: PlatformType;
      username: string;
      verification_code: string;
    }) => {
      // Call the appropriate verification edge function based on platform
      const functionName = platform === 'instagram' 
        ? 'verify-instagram-bio' 
        : platform === 'tiktok'
        ? 'verify-tiktok-bio'
        : platform === 'youtube'
        ? 'verify-youtube-bio'
        : null;

      if (!functionName) {
        throw new Error('Auto-verification not available for this platform. Please contact support.');
      }

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { username, verification_code },
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'Verification failed');
      }

      if (!data?.verified) {
        throw new Error(data?.message || 'Verification code not found in bio');
      }

      // If verified, update the database
      const { data: updated, error: updateError } = await supabase
        .from("social_accounts")
        .update({
          verified: true,
          verified_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (updateError) throw updateError;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["all-social-accounts"] });
    },
  });
}
