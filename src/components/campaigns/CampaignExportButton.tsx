import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  CampaignReportData, 
  SubmissionExportData, 
  generateCampaignCSV, 
  downloadCSV 
} from "@/lib/exportUtils";
import { useToast } from "@/hooks/use-toast";

interface CampaignExportButtonProps {
  campaignId: string;
  campaignName: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function CampaignExportButton({ 
  campaignId, 
  campaignName, 
  variant = "outline",
  size = "default" 
}: CampaignExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // Fetch campaign data
      const { data: campaign, error: campaignError } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", campaignId)
        .single();

      if (campaignError) throw campaignError;

      // Fetch submissions with creator info
      const { data: submissions, error: submissionsError } = await supabase
        .from("submissions")
        .select(`
          *,
          creator:profiles!submissions_creator_id_fkey(full_name, email, clipper_tier)
        `)
        .eq("campaign_id", campaignId);

      if (submissionsError) throw submissionsError;

      // Prepare export data
      const submissionData: SubmissionExportData[] = (submissions || []).map(sub => ({
        clipperUsername: sub.creator?.full_name || "Unknown",
        clipperEmail: sub.creator?.email || "",
        clipperTier: sub.creator?.clipper_tier || "standard",
        platform: sub.platform,
        clipUrl: sub.clip_url,
        views: sub.views || 0,
        likes: sub.likes || 0,
        comments: sub.comments || 0,
        status: sub.status,
        earnings: Number(sub.earnings) || 0,
        submittedAt: new Date(sub.created_at).toLocaleDateString()
      }));

      const reportData: CampaignReportData = {
        campaignName: campaign.name,
        campaignId: campaign.id,
        totalBudget: Number(campaign.total_budget),
        spentBudget: Number(campaign.spent_budget),
        remainingBudget: Number(campaign.total_budget) - Number(campaign.spent_budget),
        totalViews: submissionData.reduce((sum, s) => sum + s.views, 0),
        totalSubmissions: submissions?.length || 0,
        approvedSubmissions: submissions?.filter(s => s.status === "approved" || s.status === "paid").length || 0,
        rejectedSubmissions: submissions?.filter(s => s.status === "rejected").length || 0,
        pendingSubmissions: submissions?.filter(s => s.status === "pending").length || 0,
        submissions: submissionData
      };

      // Generate and download CSV
      const csv = generateCampaignCSV(reportData);
      const filename = `${campaignName.replace(/[^a-z0-9]/gi, '_')}_report_${new Date().toISOString().split('T')[0]}.csv`;
      downloadCSV(csv, filename);

      toast({
        title: "Export Complete",
        description: `Campaign report downloaded as ${filename}`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "Unable to export campaign data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={handleExport}
      disabled={isExporting}
      className="gap-2"
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <FileSpreadsheet className="h-4 w-4" />
          {size !== "icon" && "Export CSV"}
        </>
      )}
    </Button>
  );
}

export default CampaignExportButton;
