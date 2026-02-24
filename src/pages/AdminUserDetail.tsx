import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/app/AppLayout";
import {
  useUserProfile,
  useUserSubmissions,
  useUpdateUserStatus,
  useUserRole,
  useChangeUserRole,
} from "@/hooks/useAdminUsers";
import { useAdminLogs } from "@/hooks/useAdminLogs";
import { useCampaign } from "@/hooks/useCampaigns";
import { useAllPayouts, useUpdatePayout } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronRight,
  Ban,
  Shield,
  CheckCircle,
  XCircle,
  ExternalLink,
  Eye,
  DollarSign,
  Copy,
  Clock,
  AlertCircle,
  Wallet,
  FileText,
} from "lucide-react";

const AdminUserDetail = () => {
  const { campaignId, userId } = useParams<{
    campaignId: string;
    userId: string;
  }>();
  const { toast } = useToast();
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);

  const { data: user, isLoading: userLoading } = useUserProfile(userId || "");
  const { data: userRole, isLoading: roleLoading } = useUserRole(userId || "");
  const { data: submissions, isLoading: submissionsLoading } =
    useUserSubmissions(userId || "", campaignId);
  const { data: campaign } = useCampaign(campaignId || "");
  const { data: allPayouts } = useAllPayouts();
  const { data: logs, isLoading: logsLoading } = useAdminLogs("user", userId);

  const updateUserStatus = useUpdateUserStatus();
  const updatePayout = useUpdatePayout();
  const changeRole = useChangeUserRole();

  const userPayouts =
    allPayouts?.filter((p: any) => p.user_id === userId) || [];
  const pendingPayouts = userPayouts.filter((p: any) => p.status === "pending");

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard` });
  };

  const ALL_ROLES = [
    { value: "creator", label: "Creator" },
    { value: "brand", label: "Brand" },
    { value: "admin", label: "Admin" },
    { value: "client_admin", label: "Client Admin" },
    { value: "client_manager", label: "Client Manager" },
    { value: "client_viewer", label: "Client Viewer" },
    { value: "clipper", label: "Clipper" },
    { value: "platform_admin", label: "Platform Admin" },
  ];

  const handleRoleChange = async () => {
    if (!pendingRole || !userId) return;
    try {
      await changeRole.mutateAsync({ userId, newRole: pendingRole });
      toast({ title: "Role updated", description: `User role changed to ${pendingRole.replace(/_/g, " ")}` });
    } catch (error: any) {
      toast({ title: "Error", description: error?.message || "Failed to change role", variant: "destructive" });
    } finally {
      setPendingRole(null);
      setRoleDialogOpen(false);
    }
  };

  const handleBan = async () => {
    try {
      console.debug("handleBan invoked", { userId });
      await updateUserStatus.mutateAsync({
        userId: userId!,
        updates: { is_banned: true },
        action: "ban_user",
      });
      toast({ title: "User banned" });
    } catch (error: any) {
      console.error("handleBan error:", error);
      const desc =
        error?.message ||
        error?.error ||
        JSON.stringify(error) ||
        "Unknown error";
      toast({
        title: "Error",
        description: String(desc),
        variant: "destructive",
      });
    }
  };

  const handleUnban = async () => {
    try {
      console.debug("handleUnban invoked", { userId });
      await updateUserStatus.mutateAsync({
        userId: userId!,
        updates: { is_banned: false },
        action: "unban_user",
      });
      toast({ title: "User unbanned" });
    } catch (error: any) {
      console.error("handleUnban error:", error);
      const desc =
        error?.message ||
        error?.error ||
        JSON.stringify(error) ||
        "Unknown error";
      toast({
        title: "Error",
        description: String(desc),
        variant: "destructive",
      });
    }
  };

  const handleVerifyPayment = async () => {
    try {
      console.debug("handleVerifyPayment invoked", { userId });
      await updateUserStatus.mutateAsync({
        userId: userId!,
        updates: { payment_verified: true },
        action: "verify_payment",
      });
      toast({ title: "Payment method verified" });
    } catch (error: any) {
      console.error("handleVerifyPayment error:", error);
      const desc =
        error?.message ||
        error?.error ||
        JSON.stringify(error) ||
        "Unknown error";
      toast({
        title: "Error",
        description: String(desc),
        variant: "destructive",
      });
    }
  };

  const handlePayoutAction = async (
    payoutId: string,
    status: "approved" | "rejected" | "paid"
  ) => {
    try {
      await updatePayout.mutateAsync({ id: payoutId, status });
      toast({ title: `Payout ${status}` });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
      case "paid":
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-emerald-500/10 text-emerald-400">
            {status}
          </span>
        );
      case "rejected":
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-red-500/10 text-red-400">
            {status}
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/10 text-yellow-400">
            {status}
          </span>
        );
    }
  };

  if (userLoading) {
    return (
      <AppLayout title="User Details">
        <Skeleton className="h-96" />
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout title="User Not Found">
        <div className="text-center py-16">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">User not found</h3>
        </div>
      </AppLayout>
    );
  }

  const totalViews =
    submissions?.reduce((sum, s) => sum + Number(s.views || 0), 0) || 0;
  const totalEarnings =
    submissions?.reduce((sum, s) => sum + Number(s.earnings || 0), 0) || 0;

  return (
    <AppLayout title={user.full_name || "User Details"}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground mb-6 flex-wrap">
        <Link to="/admin/payouts" className="hover:text-foreground transition-colors whitespace-nowrap">Campaigns</Link>
        <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
        <Link to={`/admin/payouts/campaign/${campaignId}`} className="hover:text-foreground transition-colors truncate max-w-[120px] sm:max-w-none">{campaign?.name}</Link>
        <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
        <span className="text-foreground truncate">{user.full_name || user.email}</span>
      </div>

      {/* User Header Card */}
      <div className="page-enter">
      <div className="p-4 sm:p-6 rounded-2xl bg-card/50 border border-border/30 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-primary flex items-center justify-center text-xl sm:text-2xl font-bold text-primary-foreground overflow-hidden">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  user.full_name?.charAt(0) || "?"
                )}
              </div>
              {user.is_banned && (
                <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-1">
                  <Ban className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-display font-bold flex items-center gap-2 flex-wrap">
                <span className="truncate">{user.full_name || "Anonymous"}</span>
                {user.is_banned && (
                  <span className="text-xs text-red-400">(Banned)</span>
                )}
              </h2>
              <p className="text-muted-foreground text-sm truncate">{user.email}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {user.payment_verified ? (
                  <span className="px-2 py-1 rounded text-xs bg-emerald-500/10 text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Payment Verified
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded text-xs bg-yellow-500/10 text-yellow-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Payment Unverified
                  </span>
                )}
                <Select
                  value={userRole || "creator"}
                  onValueChange={(val) => {
                    if (val !== userRole) {
                      setPendingRole(val);
                      setRoleDialogOpen(true);
                    }
                  }}
                  disabled={roleLoading || changeRole.isPending}
                >
                  <SelectTrigger className="h-7 w-auto min-w-[120px] text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value} className="text-xs">
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-shrink-0">
            {!user.payment_verified && (
              <Button size="sm" variant="outline" onClick={handleVerifyPayment}>
                <Shield className="h-4 w-4 mr-1" />
                Verify
              </Button>
            )}
            {user.is_banned ? (
              <Button size="sm" variant="outline" onClick={handleUnban}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Unban
              </Button>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive">
                    <Ban className="h-4 w-4 mr-1" />
                    Ban User
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Ban User?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will prevent the user from logging in and submitting clips. Pending payouts will be blocked.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBan} className="bg-red-500 hover:bg-red-600">
                      Ban User
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Campaign Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-5 pt-5 border-t border-border/30">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-display font-bold">{submissions?.length || 0}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Submissions</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold flex items-center justify-center gap-1">
              <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              {formatNumber(totalViews)}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">Total Views</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-primary flex items-center justify-center gap-1">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
              {totalEarnings.toFixed(2)}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">Earnings</div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="submissions" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="submissions" className="text-xs sm:text-sm">Submissions</TabsTrigger>
          <TabsTrigger value="payment" className="text-xs sm:text-sm">Payment</TabsTrigger>
          <TabsTrigger value="payouts" className="text-xs sm:text-sm">
            Payouts ({userPayouts.length})
          </TabsTrigger>
          <TabsTrigger value="logs" className="text-xs sm:text-sm">Audit Logs</TabsTrigger>
        </TabsList>

        {/* Submissions Tab */}
        <TabsContent value="submissions">
          {submissionsLoading ? (
            <div className="space-y-4">
              {Array(3)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
            </div>
          ) : submissions?.length === 0 ? (
            <div className="p-8 rounded-xl bg-card border border-border text-center text-muted-foreground">
              No submissions for this campaign
            </div>
          ) : (
            <div className="space-y-3">
              {submissions?.map((sub: any) => (
                <div
                  key={sub.id}
                  className="p-4 rounded-xl bg-card border border-border"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <a
                        href={sub.clip_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 text-sm break-all min-w-0"
                      >
                        <ExternalLink className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{sub.clip_url.replace(/https?:\/\/(www\.)?/, '').slice(0, 40)}...</span>
                      </a>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {getStatusBadge(sub.status)}
                        <span className="text-xs text-muted-foreground">
                          {new Date(sub.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                      <span className="capitalize">{sub.platform}</span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" /> {formatNumber(sub.views)}
                      </span>
                      <span className="flex items-center gap-1 text-primary">
                        <DollarSign className="h-4 w-4" /> $
                        {Number(sub.earnings).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Payment Details Tab */}
        <TabsContent value="payment">
          <div className="p-6 rounded-xl bg-card border border-border">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Payment Method
            </h3>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-secondary/50">
                <div className="text-sm text-muted-foreground mb-1">Method</div>
                <div className="font-medium capitalize">
                  {user.payout_method === "usdc_solana"
                    ? "USDC (Solana)"
                    : user.payout_method || "Not set"}
                </div>
              </div>

              {user.payout_method === "paypal" && (
                <div className="p-4 rounded-lg bg-secondary/50">
                  <div className="text-sm text-muted-foreground mb-1">
                    PayPal Email
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="font-mono">
                      {user.payout_email || "Not set"}
                    </code>
                    {user.payout_email && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() =>
                          copyToClipboard(user.payout_email!, "PayPal email")
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {user.payout_method === "usdc_solana" && (
                <div className="p-4 rounded-lg bg-secondary/50">
                  <div className="text-sm text-muted-foreground mb-1">
                    Solana Wallet
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-sm break-all">
                      {user.solana_wallet_address || "Not set"}
                    </code>
                    {user.solana_wallet_address && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 flex-shrink-0"
                        onClick={() =>
                          copyToClipboard(
                            user.solana_wallet_address!,
                            "Wallet address"
                          )
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-4">
                <span
                  className={`px-3 py-1.5 rounded-lg text-sm ${
                    user.payment_verified
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-yellow-500/10 text-yellow-400"
                  }`}
                >
                  {user.payment_verified ? "✓ Verified" : "⚠ Unverified"}
                </span>
                {!user.payment_verified && (
                  <Button size="sm" onClick={handleVerifyPayment}>
                    Verify Payment Method
                  </Button>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Payouts Tab */}
        <TabsContent value="payouts">
          {userPayouts.length === 0 ? (
            <div className="p-8 rounded-xl bg-card border border-border text-center text-muted-foreground">
              No payout requests
            </div>
          ) : (
            <div className="space-y-3">
              {userPayouts.map((payout: any) => (
                <div
                  key={payout.id}
                  className="p-5 rounded-xl bg-card border border-border"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="text-2xl font-bold text-primary">
                          ${Number(payout.amount).toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Requested{" "}
                          {new Date(payout.created_at).toLocaleDateString()}
                        </div>
                        <div className="mt-1">{getStatusBadge(payout.status)}</div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {payout.status === "pending" && (
                          <>
                            {!user.payment_verified ? (
                              <div className="text-xs text-yellow-500 flex items-center gap-1">
                                <AlertCircle className="h-4 w-4" />
                                Verify payment first
                              </div>
                            ) : user.is_banned ? (
                              <div className="text-xs text-red-500 flex items-center gap-1">
                                <Ban className="h-4 w-4" />
                                User is banned
                              </div>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-emerald-500 hover:bg-emerald-600"
                                  onClick={() =>
                                    handlePayoutAction(payout.id, "approved")
                                  }
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" /> Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    handlePayoutAction(payout.id, "rejected")
                                  }
                                >
                                  <XCircle className="h-4 w-4 mr-1" /> Reject
                                </Button>
                              </>
                            )}
                          </>
                        )}

                        {payout.status === "approved" && (
                          <Button
                            size="sm"
                            onClick={() => handlePayoutAction(payout.id, "paid")}
                          >
                            <DollarSign className="h-4 w-4 mr-1" /> Mark as Paid
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="logs">
          {logsLoading ? (
            <Skeleton className="h-40" />
          ) : logs?.length === 0 ? (
            <div className="p-8 rounded-xl bg-card border border-border text-center text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
              No admin actions logged
            </div>
          ) : (
            <div className="space-y-2">
              {logs?.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-lg bg-card border border-border flex items-center gap-4"
                >
                  <div className="p-2 rounded-lg bg-secondary">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium capitalize">
                      {log.action.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      </div>

      {/* Role Change Confirmation Dialog */}
      <AlertDialog open={roleDialogOpen} onOpenChange={(open) => {
        if (!open) setPendingRole(null);
        setRoleDialogOpen(open);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change User Role?</AlertDialogTitle>
            <AlertDialogDescription>
              This will change <strong>{user?.full_name || user?.email}</strong>'s role from{" "}
              <strong className="capitalize">{(userRole || "creator").replace(/_/g, " ")}</strong> to{" "}
              <strong className="capitalize">{(pendingRole || "").replace(/_/g, " ")}</strong>.
              This action takes effect immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRoleChange} disabled={changeRole.isPending}>
              {changeRole.isPending ? "Changing..." : "Confirm Change"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default AdminUserDetail;
