import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // H-07: submissions must be deleted through the delete-submission
      // Edge Function (accounting_clip "delete"), which reverses wallet
      // earnings / campaign spend server-side and refuses paid clips.
      // A direct `submissions` DELETE bypasses that reversal — and an
      // admin has no DELETE policy on other users' submissions at all,
      // so the old client-side delete failed on them.
      const { data: submissions, error: listError } = await supabase
        .from("submissions")
        .select("id")
        .eq("campaign_id", id);

      if (listError) throw listError;

      for (const sub of submissions ?? []) {
        const { data, error } = await supabase.functions.invoke("delete-submission", {
          body: { submission_id: sub.id },
        });
        // Surface the failure instead of silently continuing: a failed
        // delete leaves the submission (and its earnings) in place, and
        // the campaign delete below must not run on a half-deleted set.
        if (error) throw new Error((data as { error?: string } | null)?.error || error.message);
        if ((data as { error?: string } | null)?.error) throw new Error((data as { error: string }).error);
      }

      // Then delete the campaign
      const { error } = await supabase
        .from("campaigns")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}
