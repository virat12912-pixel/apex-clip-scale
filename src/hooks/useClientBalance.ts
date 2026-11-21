import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ClientBalance {
  id: string;
  user_id: string;
  available_balance: number;
  total_funded: number;
  total_spent: number;
  pending_spend: number;
  created_at: string;
  updated_at: string;
}

export interface BalanceTransaction {
  id: string;
  user_id: string;
  type: "credit" | "debit" | "campaign_spend" | "topup_request";
  amount: number;
  description: string | null;
  notes: string | null;
  related_campaign_id: string | null;
  created_at: string;
}

export function useClientBalance() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["client-balance", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("client_balances")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      // H-06: never auto-create a balance row on read. Rows are created
      // server-side with zeros only (profiles INSERT trigger /
      // ensure_user_setup), and a client insert could self-credit
      // arbitrary funds. A missing row is a zero balance: callers treat
      // `null` as $0 and show the top-up prompt.
      return (data as ClientBalance | null) ?? null;
    },
    enabled: !!user,
  });
}

export function useBalanceTransactions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["balance-transactions", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("balance_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as BalanceTransaction[];
    },
    enabled: !!user,
  });
}

export function useRequestTopUp() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ amount, notes }: { amount: number; notes?: string }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("balance_transactions")
        .insert({
          user_id: user.id,
          type: "topup_request",
          amount,
          description: "Balance top-up request",
          notes: notes || "Pending admin approval",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["balance-transactions"] });
    },
  });
}
