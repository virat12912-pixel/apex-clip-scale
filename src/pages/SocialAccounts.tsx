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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim()) { toast({ title: "Username required", variant: "destructive" }); return; }
    try {
      await createAccount.mutateAsync({ platform: formData.platform, username: formData.username.trim(), profile_url: formData.profile_url.trim() || undefined });
      toast({ title: "Account added! Add verification code to your bio, then click Verify." });
      setIsOpen(false);
      setFormData({ platform: "tiktok", username: "", profile_url: "" });
    } catch (error: any) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
  };

  const handleDelete = async (id: string) => {
    try { await deleteAccount.mutateAsync(id); toast({ title: "Account removed" }); }
    catch (error: any) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
  };

  const handleVerify = async (account: { id: string; platform: PlatformType; username: string; verification_code: string }) => {
    if (account.platform === "youtube") { toast({ title: "YouTube verification", description: "YouTube auto-verification is not available yet.", variant: "destructive" }); return; }
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
      <div className="max-w-4xl mx-auto page-enter">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-display font-bold">Linked Social Accounts</h1>
            <p className="text-muted-foreground/60">Connect your social accounts to verify ownership</p>
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
        <div className="p-5 rounded-2xl bg-primary/5 border border-primary/15 mb-6 flex items-start gap-3">
          <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-display font-bold mb-1">How verification works</p>
            <p className="text-muted-foreground/60">
              1. Add your account below<br />
              2. Copy the verification code and add it to your bio<br />
              3. Click the "Verify" button to automatically check your bio
            </p>
          </div>
        </div>

        {/* Accounts List */}
        {isLoading ? (
          <div className="space-y-4">{[1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
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
          <div className="space-y-3 stagger-enter">
            {accounts?.map((account) => (
              <div key={account.id} className="p-5 rounded-2xl bg-card/40 border border-border/20 transition-all duration-300 hover:border-primary/15 hover:shadow-lg group">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110 ${account.verified ? "bg-emerald-500/10" : "bg-primary/10"}`}>
                      <span className={account.verified ? "text-emerald-400" : "text-primary"}>
                        {platformIcons[account.platform]}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-bold">{account.username}</span>
                        <span className="text-xs px-2 py-0.5 rounded-lg bg-secondary/50 text-muted-foreground/60 capitalize">{platformLabels[account.platform]}</span>
                        {account.verified ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg"><CheckCircle className="h-3 w-3" />Verified</span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-lg"><Clock className="h-3 w-3" />Pending</span>
                        )}
                      </div>
                      {account.profile_url && (
                        <a href={account.profile_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary/60 hover:text-primary flex items-center gap-1 mt-1 transition-colors duration-200">
                          View Profile <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {!account.verified && (
                      <>
                        <div className="flex items-center gap-2">
                          <code className="px-3 py-1.5 rounded-lg bg-secondary/30 text-sm font-mono border border-border/20">{account.verification_code}</code>
                          <Button variant="outline" size="icon" onClick={() => copyCode(account.verification_code)} className="rounded-lg border-border/20">
                            {copiedCode === account.verification_code ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                        <Button
                          size="sm" onClick={() => handleVerify({ id: account.id, platform: account.platform, username: account.username, verification_code: account.verification_code })}
                          disabled={verifyingId === account.id}
                          className="bg-emerald-500 hover:bg-emerald-600 rounded-lg font-semibold"
                        >
                          {verifyingId === account.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ShieldCheck className="h-4 w-4 mr-1" />Verify</>}
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(account.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default SocialAccounts;
