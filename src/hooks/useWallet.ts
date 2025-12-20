import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Wallet {
  id: string;
  user_id: string;
  pending_balance: number;
  paid_balance: number;
  created_at: string;
  updated_at: string;
}

export interface Payout {
  id: string;
  user_id: string;
  amount: number;
  payout_method: string;
  payout_email: string;
  status: "pending" | "approved" | "paid" | "rejected";
  admin_notes: string | null;
  processed_at: string | null;
  created_at: string;
}

export function useWallet() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Wallet | null;
    },
    enabled: !!user,
  });
}

export function usePayouts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["payouts", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Explicitly exclude admin_notes for security
      const { data, error } = await supabase
        .from("payouts")
        .select("id, user_id, amount, payout_method, payout_email, status, processed_at, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Omit<Payout, 'admin_notes'>[];
    },
    enabled: !!user,
  });
}

export function useAllPayouts() {
  return useQuery({
    queryKey: ["payouts", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payouts")
        .select(`
          *,
          user_profile:profiles!payouts_user_id_fkey(full_name, email)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useRequestPayout() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async (amount: number) => {
      if (!user || !profile) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("payouts")
        .insert({
          user_id: user.id,
          amount,
          payout_method: profile.payout_method || "paypal",
          payout_email: profile.payout_email || profile.email,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payouts"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}

export function useUpdatePayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Payout> & { id: string }) => {
      const { data, error } = await supabase
        .from("payouts")
        .update({
          ...updates,
          processed_at: updates.status === "paid" ? new Date().toISOString() : null,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payouts"] });
    },
  });
}
