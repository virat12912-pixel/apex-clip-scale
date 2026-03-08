import { useState } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { 
  Plus, Trash2, CheckCircle, Clock, Copy, Check,
  Smartphone, Camera, Play, ExternalLink, Info, ShieldCheck, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useMySocialAccounts, useCreateSocialAccount, useDeleteSocialAccount, useVerifySocialAccount } from "@/hooks/useSocialAccounts";
import { Database } from "@/integrations/supabase/types";

type PlatformType = Database["public"]["Enums"]["platform_type"];

const platformIcons: Record<PlatformType, React.ReactNode> = {
  tiktok: <Smartphone className="h-5 w-5" />,
  instagram: <Camera className="h-5 w-5" />,
  youtube: <Play className="h-5 w-5" />,
};

const platformLabels: Record<PlatformType, string> = {
  tiktok: "TikTok", instagram: "Instagram", youtube: "YouTube",
};

const AccountCard = ({ account, onVerify, onDelete, onCopy, copiedCode, verifyingId }: {
  account: any;
  onVerify: (account: any) => void;
  onDelete: (id: string) => void;
  onCopy: (code: string) => void;
  copiedCode: string | null;
  verifyingId: string | null;
}) => (
  <div className="p-4 rounded-2xl bg-card/40 border border-border/20 transition-all duration-300 hover:border-primary/15 hover:shadow-lg group">
    <div className="flex items-center gap-3 mb-3">
      <div className={`p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110 flex-shrink-0 ${account.verified ? "bg-emerald-500/10" : "bg-primary/10"}`}>
        <span className={account.verified ? "text-emerald-400" : "text-primary"}>
          {platformIcons[account.platform as PlatformType]}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-display font-bold truncate">{account.username}</span>
          <span className="text-xs px-2 py-0.5 rounded-lg bg-secondary/50 text-muted-foreground/60 capitalize">{platformLabels[account.platform as PlatformType]}</span>
        </div>
        {account.profile_url && (
          <a href={account.profile_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary/60 hover:text-primary flex items-center gap-1 mt-0.5 transition-colors duration-200 truncate">
            View Profile <ExternalLink className="h-3 w-3 flex-shrink-0" />
          </a>
        )}
      </div>
      <Button variant="ghost" size="icon" onClick={() => onDelete(account.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg flex-shrink-0 h-8 w-8">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
    
    {!account.verified && (
      <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border/15">
        <code className="px-2.5 py-1 rounded-lg bg-secondary/30 text-xs font-mono border border-border/20 truncate">{account.verification_code}</code>
        <Button variant="outline" size="icon" onClick={() => onCopy(account.verification_code)} className="rounded-lg border-border/20 h-8 w-8 flex-shrink-0">
          {copiedCode === account.verification_code ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
        <Button
          size="sm" onClick={() => onVerify(account)}
          disabled={verifyingId === account.id}
          className="bg-emerald-500 hover:bg-emerald-600 rounded-lg font-semibold text-xs ml-auto"
        >
          {verifyingId === account.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><ShieldCheck className="h-3.5 w-3.5 mr-1" />Verify</>}
        </Button>
      </div>
    )}
  </div>
);

const SocialAccounts = () => {
  const { data: accounts, isLoading } = useMySocialAccounts();
  const createAccount = useCreateSocialAccount();
  const deleteAccount = useDeleteSocialAccount();
  const verifyAccount = useVerifySocialAccount();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ platform: "tiktok" as PlatformType, username: "", profile_url: "" });

  const verifiedAccounts = accounts?.filter(a => a.verified) || [];
  const pendingAccounts = accounts?.filter(a => !a.verified) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim()) { toast({ title: "Username required", variant: "destructive" }); return; }
    try {
      await createAccount.mutateAsync({ platform: formData.platform, username: formData.username.trim(), profile_url: formData.profile_url.trim() || undefined });
      toast({ title: "Account added! Add verification code to your bio, then click Verify." });
      setIsOpen(false);
      setFormData({ platform: "tiktok", username: "", profile_url: "" });
    } catch (error: any) {
      const isDuplicate = error.message?.includes("social_accounts_user_id_platform_username_key");
      toast({
        title: isDuplicate ? "Account already linked" : "Error",
        description: isDuplicate
          ? "This username is already linked to your profile on this platform."
          : error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try { await deleteAccount.mutateAsync(id); toast({ title: "Account removed" }); }
    catch (error: any) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
  };

  const handleVerify = async (account: { id: string; platform: PlatformType; username: string; verification_code: string }) => {
    
    setVerifyingId(account.id);
    try {
      await verifyAccount.mutateAsync({ id: account.id, platform: account.platform, username: account.username, verification_code: account.verification_code });
      toast({ title: "Verified!", description: "Your account has been successfully verified." });
    } catch (error: any) { toast({ title: "Verification failed", description: error.message, variant: "destructive" }); }
    finally { setVerifyingId(null); }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <AppLayout title="Social Accounts">
      <div className="max-w-5xl mx-auto page-enter">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-display font-bold">Linked Social Accounts</h1>
            <p className="text-muted-foreground/60 text-sm">Connect your social accounts to verify ownership</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:opacity-90 glow-primary-sm btn-shimmer rounded-xl font-display font-bold">
                <Plus className="h-4 w-4 mr-2" />Add Account
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle className="font-display">Add Social Account</DialogTitle>
                <DialogDescription>Link a social media account to verify ownership</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground/60">Platform</Label>
                  <Select value={formData.platform} onValueChange={(value) => setFormData({ ...formData, platform: value as PlatformType })}>
                    <SelectTrigger className="rounded-xl bg-card/50 border-border/30"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground/60">Username</Label>
                  <Input placeholder="@yourusername" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="bg-card/50 border-border/30 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground/60">Profile URL (optional)</Label>
                  <Input placeholder="https://tiktok.com/@yourusername" value={formData.profile_url} onChange={(e) => setFormData({ ...formData, profile_url: e.target.value })} className="bg-card/50 border-border/30 rounded-xl" />
                </div>
                <Button type="submit" className="w-full bg-gradient-primary hover:opacity-90 btn-shimmer rounded-xl font-display font-bold" disabled={createAccount.isPending}>
                  {createAccount.isPending ? "Adding..." : "Add Account"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Info box */}
        <div className="p-4 sm:p-5 rounded-2xl bg-primary/5 border border-primary/15 mb-6 flex items-start gap-3">
          <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-display font-bold mb-1">How verification works</p>
            <p className="text-muted-foreground/60">
              1. Add your account below &bull; 2. Copy the verification code and add it to your bio &bull; 3. Click "Verify" to check
            </p>
          </div>
        </div>

        {/* Accounts */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">{[1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
            <div className="space-y-4">{[1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
          </div>
        ) : accounts?.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl bg-card/30 border border-border/20">
            <Smartphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-display font-bold mb-2">No accounts linked</h3>
            <p className="text-muted-foreground/50 mb-4">Add your social media accounts to verify ownership</p>
            <Button onClick={() => setIsOpen(true)} className="bg-gradient-primary hover:opacity-90 btn-shimmer rounded-xl font-display font-bold">
              <Plus className="h-4 w-4 mr-2" />Add Your First Account
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pending Column */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-yellow-400" />
                <h2 className="text-sm font-display font-bold text-yellow-400 uppercase tracking-wider">Pending ({pendingAccounts.length})</h2>
              </div>
              {pendingAccounts.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-card/30 border border-border/20 border-dashed">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-400/40" />
                  <p className="text-sm text-muted-foreground/50">All accounts verified!</p>
                </div>
              ) : (
                <div className="space-y-3 stagger-enter">
                  {pendingAccounts.map((account) => (
                    <AccountCard
                      key={account.id}
                      account={account}
                      onVerify={handleVerify}
                      onDelete={handleDelete}
                      onCopy={copyCode}
                      copiedCode={copiedCode}
                      verifyingId={verifyingId}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Verified Column */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <h2 className="text-sm font-display font-bold text-emerald-400 uppercase tracking-wider">Verified ({verifiedAccounts.length})</h2>
              </div>
              {verifiedAccounts.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-card/30 border border-border/20 border-dashed">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-yellow-400/40" />
                  <p className="text-sm text-muted-foreground/50">No verified accounts yet</p>
                </div>
              ) : (
                <div className="space-y-3 stagger-enter">
                  {verifiedAccounts.map((account) => (
                    <AccountCard
                      key={account.id}
                      account={account}
                      onVerify={handleVerify}
                      onDelete={handleDelete}
                      onCopy={copyCode}
                      copiedCode={copiedCode}
                      verifyingId={verifyingId}
                    />
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

export default SocialAccounts;