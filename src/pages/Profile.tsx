import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { User, Mail, Edit, Save, Upload, Wallet, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCreatorStats } from "@/hooks/useStats";
import { mapErrorToUserMessage, logError } from "@/lib/errorMapping";
import { ElevatedCard, ElevatedCardContent, ElevatedCardHeader, ElevatedCardTitle } from "@/components/ui/elevated-card";
import { SectionDivider } from "@/components/ui/section-divider";

const SOLANA_WALLET_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const validateSolanaWallet = (address: string): boolean => {
  if (!address) return true;
  return SOLANA_WALLET_REGEX.test(address);
};

const Profile = () => {
  const { profile, role, refreshProfile, user } = useAuth();
  const { data: stats } = useCreatorStats();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    full_name: "", bio: "", payout_method: "paypal", payout_email: "", solana_wallet_address: "",
  });
  const [walletError, setWalletError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "", bio: profile.bio || "",
        payout_method: profile.payout_method || "paypal", payout_email: profile.payout_email || "",
        solana_wallet_address: profile.solana_wallet_address || "",
      });
    }
  }, [profile]);

  const handleWalletChange = (value: string) => {
    setFormData({ ...formData, solana_wallet_address: value });
    if (value && !validateSolanaWallet(value)) {
      setWalletError("Invalid Solana wallet address (must be 32-44 Base58 characters)");
    } else { setWalletError(null); }
  };

  const handleSave = async () => {
    if (formData.payout_method === "usdc_solana" && formData.solana_wallet_address) {
      if (!validateSolanaWallet(formData.solana_wallet_address)) {
        toast({ title: "Invalid wallet address", description: "Please enter a valid Solana wallet address", variant: "destructive" });
        return;
      }
    }
    try {
      const updateData: Record<string, string | null> = {
        full_name: formData.full_name.trim(), bio: formData.bio.trim(), payout_method: formData.payout_method,
      };
      if (formData.payout_method === "paypal") { updateData.payout_email = formData.payout_email.trim(); }
      else if (formData.payout_method === "usdc_solana") { updateData.solana_wallet_address = formData.solana_wallet_address.trim(); }
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase.from("profiles").update(updateData).eq("id", user.id);
      if (error) throw error;
      await refreshProfile();
      setIsEditing(false);
      toast({ title: "Profile updated" });
    } catch (error: unknown) {
      logError("Profile:handleSave", error);
      toast({ title: "Error", description: mapErrorToUserMessage(error), variant: "destructive" });
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { toast({ title: "Invalid file", description: "Please upload an image file", variant: "destructive" }); return; }
    if (file.size > 2 * 1024 * 1024) { toast({ title: "File too large", description: "Maximum file size is 2MB", variant: "destructive" }); return; }
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const { error: updateError } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
      if (updateError) throw updateError;
      await refreshProfile();
      toast({ title: "Avatar updated!" });
    } catch (error: unknown) {
      logError("Profile:handleAvatarUpload", error);
      toast({ title: "Upload failed", description: mapErrorToUserMessage(error), variant: "destructive" });
    } finally { setUploading(false); }
  };

  const statItems = [
    { label: "Total Clips", value: stats?.totalClips?.toString() || "0" },
    { label: "Total Views", value: stats?.totalViews ? (stats.totalViews >= 1000000 ? (stats.totalViews / 1000000).toFixed(1) + "M" : stats.totalViews >= 1000 ? (stats.totalViews / 1000).toFixed(1) + "K" : stats.totalViews.toString()) : "0" },
    { label: "Approved Clips", value: stats?.approvedClips?.toString() || "0" },
    { label: "Total Earnings", value: `$${(stats?.totalEarnings || 0).toFixed(0)}` },
  ];

  return (
    <AppLayout title="My Profile">
      <div className="max-w-4xl mx-auto page-enter">
        {/* Enhanced profile header with gradient */}
        <div className="relative mb-8">
          <div className="h-36 sm:h-52 rounded-2xl overflow-hidden relative">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/8 to-transparent" />
            <div className="absolute inset-0 mesh-bg opacity-50" />
            <div className="absolute top-4 right-8 w-32 h-32 bg-primary/15 rounded-full blur-[60px] animate-pulse-glow" />
            <div className="absolute bottom-4 left-16 w-20 h-20 bg-primary/10 rounded-full blur-[40px] float" />
          </div>
          <div className="absolute -bottom-16 left-6 flex items-end gap-4">
            <div 
              className="relative w-28 h-28 rounded-2xl bg-gradient-primary flex items-center justify-center text-3xl font-display font-bold text-primary-foreground border-4 border-background overflow-hidden cursor-pointer group shadow-xl shadow-primary/20 transition-all duration-300 hover:shadow-primary/40"
              onClick={() => fileInputRef.current?.click()}
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                profile?.full_name?.charAt(0) || "U"
              )}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Upload className="h-6 w-6 text-white" />
              </div>
              {uploading && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </div>
          <div className="absolute bottom-4 right-4">
            <Button 
              variant={isEditing ? "default" : "outline"} 
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className={isEditing ? "bg-gradient-primary hover:opacity-90 glow-primary-sm btn-shimmer rounded-xl" : "rounded-xl border-border/30 hover:border-primary/30"}
            >
              {isEditing ? <><Save className="h-4 w-4 mr-2" />Save</> : <><Edit className="h-4 w-4 mr-2" />Edit</>}
            </Button>
          </div>
        </div>

        <div className="mt-20 grid lg:grid-cols-3 gap-6 stagger-enter">
          <div className="lg:col-span-2 space-y-6">
            <ElevatedCard variant="elevated" className="rounded-2xl">
              <ElevatedCardHeader>
                <ElevatedCardTitle className="section-header font-display">Profile Information</ElevatedCardTitle>
              </ElevatedCardHeader>
              <ElevatedCardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground/60">Full Name</Label>
                  <Input value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} disabled={!isEditing} className="h-12 bg-card/50 border-border/30 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground/60">Email</Label>
                  <Input value={profile?.email || ""} disabled className="h-12 bg-card/50 border-border/30 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground/60">Bio</Label>
                  <Textarea value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} disabled={!isEditing} className="min-h-[100px] bg-card/50 border-border/30 rounded-xl resize-none" />
                </div>
                
                <SectionDivider variant="gradient" size="sm" />
                <div>
                  <h3 className="font-display font-bold mb-4 flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-primary" />
                    Payment Details
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground/60">Payout Method</Label>
                      <Select value={formData.payout_method} onValueChange={(value) => setFormData({...formData, payout_method: value})} disabled={!isEditing}>
                        <SelectTrigger className="h-12 bg-card/50 border-border/30 rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paypal">PayPal</SelectItem>
                          <SelectItem value="usdc_solana">USDC (Solana)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.payout_method === "paypal" && (
                      <div className="space-y-2">
                        <Label className="text-muted-foreground/60">PayPal Email</Label>
                        <Input value={formData.payout_email} onChange={(e) => setFormData({...formData, payout_email: e.target.value})} disabled={!isEditing} placeholder="your@paypal.email" className="h-12 bg-card/50 border-border/30 rounded-xl" />
                      </div>
                    )}
                    {formData.payout_method === "usdc_solana" && (
                      <div className="space-y-2">
                        <Label className="text-muted-foreground/60">Solana Wallet Address</Label>
                        <Input value={formData.solana_wallet_address} onChange={(e) => handleWalletChange(e.target.value)} disabled={!isEditing} placeholder="Your Solana wallet address" className={`h-12 bg-card/50 border-border/30 rounded-xl font-mono text-sm ${walletError ? "border-destructive" : ""}`} />
                        {walletError && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{walletError}</p>}
                      </div>
                    )}
                  </div>
                </div>
              </ElevatedCardContent>
            </ElevatedCard>

            <ElevatedCard variant="glass" className="rounded-2xl">
              <ElevatedCardHeader>
                <ElevatedCardTitle className="section-header font-display">Stats</ElevatedCardTitle>
              </ElevatedCardHeader>
              <ElevatedCardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {statItems.map((stat) => (
                    <div key={stat.label} className="text-center p-4 rounded-xl bg-secondary/20 border border-border/15 transition-all duration-300 hover:border-primary/15 hover:-translate-y-0.5 group">
                      <div className="text-2xl font-display font-bold text-primary transition-all duration-300 group-hover:scale-105">{stat.value}</div>
                      <div className="text-sm text-muted-foreground/50">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </ElevatedCardContent>
            </ElevatedCard>
          </div>

          <div className="space-y-6">
            <ElevatedCard variant="spotlight" className="rounded-2xl">
              <ElevatedCardHeader>
                <ElevatedCardTitle className="font-display">Account Info</ElevatedCardTitle>
              </ElevatedCardHeader>
              <ElevatedCardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm group">
                  <div className="p-2.5 rounded-xl bg-primary/10 transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110"><User className="h-4 w-4 text-primary" /></div>
                  <div>
                    <div className="text-muted-foreground/50 text-xs">Role</div>
                    <div className="font-display font-bold capitalize">{role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm group">
                  <div className="p-2.5 rounded-xl bg-primary/10 transition-all duration-300 group-hover:bg-primary/20 group-hover:scale-110"><Mail className="h-4 w-4 text-primary" /></div>
                  <div>
                    <div className="text-muted-foreground/50 text-xs">Email</div>
                    <div className="font-semibold">{profile?.email}</div>
                  </div>
                </div>
              </ElevatedCardContent>
            </ElevatedCard>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;
