// CSV Export Utilities

export interface CampaignReportData {
  campaignName: string;
  campaignId: string;
  totalBudget: number;
  spentBudget: number;
  remainingBudget: number;
  totalViews: number;
  totalSubmissions: number;
  approvedSubmissions: number;
  rejectedSubmissions: number;
  pendingSubmissions: number;
  submissions: SubmissionExportData[];
}

export interface SubmissionExportData {
  clipperUsername: string;
  clipperEmail: string;
  clipperTier: string;
  platform: string;
  clipUrl: string;
  views: number;
  likes: number;
  comments: number;
  status: string;
  earnings: number;
  submittedAt: string;
}

export function generateCampaignCSV(data: CampaignReportData): string {
  const lines: string[] = [];

  // Campaign Summary Header
  lines.push("CAMPAIGN REPORT");
  lines.push(`Campaign Name,${escapeCSV(data.campaignName)}`);
  lines.push(`Campaign ID,${data.campaignId}`);
  lines.push(`Total Budget,$${data.totalBudget.toFixed(2)}`);
  lines.push(`Spent Budget,$${data.spentBudget.toFixed(2)}`);
  lines.push(`Remaining Budget,$${data.remainingBudget.toFixed(2)}`);
  lines.push(`Total Views,${data.totalViews}`);
  lines.push(`Total Submissions,${data.totalSubmissions}`);
  lines.push(`Approved,${data.approvedSubmissions}`);
  lines.push(`Rejected,${data.rejectedSubmissions}`);
  lines.push(`Pending,${data.pendingSubmissions}`);
  lines.push("");
  
  // Submissions Header
  lines.push("SUBMISSIONS");
  lines.push([
    "Clipper Username",
    "Clipper Email", 
    "Clipper Tier",
    "Platform",
    "Clip URL",
    "Views",
    "Likes",
    "Comments",
    "Status",
    "Earnings",
    "Submitted At"
  ].join(","));

  // Submissions Data
  for (const sub of data.submissions) {
    lines.push([
      escapeCSV(sub.clipperUsername),
      escapeCSV(sub.clipperEmail),
      sub.clipperTier,
      sub.platform,
      escapeCSV(sub.clipUrl),
      sub.views.toString(),
      sub.likes.toString(),
      sub.comments.toString(),
      sub.status,
      `$${sub.earnings.toFixed(2)}`,
      sub.submittedAt
    ].join(","));
  }

  return lines.join("\n");
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

function escapeCSV(value: string): string {
  if (!value) return "";
  // Escape quotes and wrap in quotes if contains comma, newline, or quote
  if (value.includes(",") || value.includes("\n") || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Platform Analytics Export
export interface PlatformAnalyticsData {
  date: string;
  totalViews: number;
  totalEarnings: number;
  newSubmissions: number;
  activeCampaigns: number;
  pendingPayouts: number;
}

export function generatePlatformAnalyticsCSV(data: PlatformAnalyticsData[]): string {
  const lines: string[] = [];
  
  lines.push("PLATFORM ANALYTICS REPORT");
  lines.push(`Generated,${new Date().toISOString()}`);
  lines.push("");
  
  lines.push([
    "Date",
    "Total Views",
    "Total Earnings",
    "New Submissions",
    "Active Campaigns",
    "Pending Payouts"
  ].join(","));

  for (const row of data) {
    lines.push([
      row.date,
      row.totalViews.toString(),
      `$${row.totalEarnings.toFixed(2)}`,
      row.newSubmissions.toString(),
      row.activeCampaigns.toString(),
      `$${row.pendingPayouts.toFixed(2)}`
    ].join(","));
  }

  return lines.join("\n");
}

// Clipper Performance Export
export interface ClipperPerformanceData {
  username: string;
  email: string;
  tier: string;
  totalViews: number;
  totalEarnings: number;
  totalSubmissions: number;
  approvalRate: number;
  joinedAt: string;
}

export function generateClipperPerformanceCSV(data: ClipperPerformanceData[]): string {
  const lines: string[] = [];
  
  lines.push("CLIPPER PERFORMANCE REPORT");
  lines.push(`Generated,${new Date().toISOString()}`);
  lines.push("");
  
  lines.push([
    "Username",
    "Email",
    "Tier",
    "Total Views",
    "Total Earnings",
    "Total Submissions",
    "Approval Rate",
    "Joined At"
  ].join(","));

  for (const row of data) {
    lines.push([
      escapeCSV(row.username),
      escapeCSV(row.email),
      row.tier,
      row.totalViews.toString(),
      `$${row.totalEarnings.toFixed(2)}`,
      row.totalSubmissions.toString(),
      `${row.approvalRate.toFixed(1)}%`,
      row.joinedAt
    ].join(","));
  }

  return lines.join("\n");
}
