import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface BrandApplication {
  id: string;
  user_id: string;
  company_name: string;
  email: string;
  campaign_goals: string;
  status: "pending" | "approved" | "rejected";
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  profile?: {
    full_name: string | null;
    email: string;
  };
}

export function useMyBrandApplication() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["brand-application", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("brand_applications")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as BrandApplication | null;
    },
    enabled: !!user,
  });
}

export function useAllBrandApplications() {
  const { role } = useAuth();

  return useQuery({
    queryKey: ["brand-applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brand_applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BrandApplication[];
    },
    enabled: role === "admin",
  });
}

export function useCreateBrandApplication() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      company_name: string;
      email: string;
      campaign_goals: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("brand_applications").insert({
        user_id: user.id,
        ...data,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-application"] });
    },
  });
}

export function useUpdateBrandApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      admin_notes,
      user_id,
    }: {
      id: string;
      status: "approved" | "rejected";
      admin_notes?: string;
      user_id: string;
    }) => {
      // Update the application status
      const { error: appError } = await supabase
        .from("brand_applications")
        .update({ status, admin_notes })
        .eq("id", id);

      if (appError) throw appError;

      // If approved, upgrade user role to brand. This must go through the
      // admin-change-role Edge Function: the direct `upgrade_user_role` RPC
      // grant was revoked (C-01), so calling it from the browser is denied.
      // The function checks the caller is an admin and calls the RPC with
      // the service-role client.
      if (status === "approved") {
        const { data, error: roleError } = await supabase.functions.invoke("admin-change-role", {
          body: { user_id, new_role: "brand" },
        });
        if (roleError) throw new Error((data as { error?: string } | null)?.error || roleError.message);
        if ((data as { error?: string } | null)?.error) throw new Error((data as { error: string }).error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brand-applications"] });
    },
  });
}
