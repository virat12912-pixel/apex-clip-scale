import { useState } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { 
  CheckCircle, 
  Clock, 
  XCircle,
  Smartphone,
  Camera,
  Play,
  ExternalLink,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAllSocialAccounts, useVerifySocialAccount } from "@/hooks/useSocialAccounts";
import { Database } from "@/integrations/supabase/types";

type PlatformType = Database["public"]["Enums"]["platform_type"];

const platformIcons: Record<PlatformType, React.ReactNode> = {
  tiktok: <Smartphone className="h-5 w-5" />,
  instagram: <Camera className="h-5 w-5" />,
  youtube: <Play className="h-5 w-5" />,
};

const platformLabels: Record<PlatformType, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
};

const AdminSocialAccounts = () => {
  const { data: accounts, isLoading } = useAllSocialAccounts();
  const verifyAccount = useVerifySocialAccount();
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  const filteredAccounts = accounts?.filter(account => 
    account.username.toLowerCase().includes(search.toLowerCase()) ||
    account.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    account.profile?.email.toLowerCase().includes(search.toLowerCase())
  );

  const pendingAccounts = filteredAccounts?.filter(a => !a.verified) || [];
  const verifiedAccounts = filteredAccounts?.filter(a => a.verified) || [];

  const handleVerify = async (id: string) => {
    try {
      await verifyAccount.mutateAsync(id);
      toast({ title: "Account verified!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <AppLayout title="Social Account Verification">
      <div className="page-enter">
        {/* Search */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-secondary"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pending Verification */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-400" />
                Pending Verification ({pendingAccounts.length})
              </h2>
              
              {pendingAccounts.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-card border border-border">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-emerald-400" />
                  <p className="text-muted-foreground">No pending verifications</p>
                </div>
              ) : (
                <div className="space-y-3 stagger-enter">
                  {pendingAccounts.map((account) => (
                    <div 
                      key={account.id}
                      className="p-5 rounded-xl bg-card border border-border card-hover"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-yellow-500/10">
                            <span className="text-yellow-400">
                              {platformIcons[account.platform]}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{account.username}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                                {platformLabels[account.platform]}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {account.profile?.full_name || account.profile?.email}
                            </p>
                            <code className="text-xs text-primary">
                              Code: {account.verification_code}
                            </code>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {account.profile_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <a href={account.profile_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Check Bio
                              </a>
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => handleVerify(account.id)}
                            disabled={verifyAccount.isPending}
                            className="bg-emerald-500 hover:bg-emerald-600"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Verify
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Verified Accounts */}
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
                Verified Accounts ({verifiedAccounts.length})
              </h2>
              
              {verifiedAccounts.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-card border border-border">
                  <p className="text-muted-foreground">No verified accounts yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {verifiedAccounts.slice(0, 10).map((account) => (
                    <div 
                      key={account.id}
                      className="p-4 rounded-xl bg-card border border-border"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-emerald-500/10">
                            <span className="text-emerald-400">
                              {platformIcons[account.platform]}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">{account.username}</span>
                            <span className="text-sm text-muted-foreground ml-2">
                              ({account.profile?.full_name || account.profile?.email})
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Verified
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AdminSocialAccounts;
