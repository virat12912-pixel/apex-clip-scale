import { useState, useRef } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { User, Mail, Edit, Save, Copy, Share2, Check, Upload, Wallet } from "lucide-react";
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

const Profile = () => {
  const { profile, role, refreshProfile, user } = useAuth();
  const { data: stats } = useCreatorStats();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    bio: profile?.bio || "",
    payout_method: profile?.payout_method || "paypal",
    payout_email: profile?.payout_email || "",
    solana_wallet_address: profile?.solana_wallet_address || "",
  });

  const handleSave = async () => {
    try {
      const updateData: Record<string, string | null> = {
        full_name: formData.full_name,
        bio: formData.bio,
        payout_method: formData.payout_method,
      };

      // Only save relevant payment field based on method
      if (formData.payout_method === "paypal") {
        updateData.payout_email = formData.payout_email;
      } else if (formData.payout_method === "usdc_solana") {
        updateData.solana_wallet_address = formData.solana_wallet_address;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", profile?.id);

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

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file", variant: "destructive" });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 2MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      toast({ title: "Avatar updated!" });
    } catch (error: unknown) {
      logError("Profile:handleAvatarUpload", error);
      toast({ title: "Upload failed", description: mapErrorToUserMessage(error), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const referralLink = `${window.location.origin}/auth?ref=${profile?.referral_code}`;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "Copied!", description: "Referral link copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const statItems = [
    { label: "Total Clips", value: stats?.totalClips?.toString() || "0" },
    { label: "Total Views", value: stats?.totalViews ? (stats.totalViews >= 1000000 ? (stats.totalViews / 1000000).toFixed(1) + "M" : stats.totalViews >= 1000 ? (stats.totalViews / 1000).toFixed(1) + "K" : stats.totalViews.toString()) : "0" },
    { label: "Approved Clips", value: stats?.approvedClips?.toString() || "0" },
    { label: "Total Earnings", value: `$${(stats?.totalEarnings || 0).toFixed(0)}` },
  ];

  return (
    <AppLayout title="My Profile">
      <div className="max-w-4xl mx-auto">
        <div className="relative mb-8">
          <div className="h-32 sm:h-48 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
          <div className="absolute -bottom-16 left-6 flex items-end gap-4">
            <div 
              className="relative w-28 h-28 rounded-2xl bg-gradient-primary flex items-center justify-center text-3xl font-bold text-primary-foreground border-4 border-background overflow-hidden cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                profile?.full_name?.charAt(0) || "U"
              )}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload className="h-6 w-6 text-white" />
              </div>
              {uploading && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <div className="absolute bottom-4 right-4">
            <Button variant={isEditing ? "default" : "outline"} onClick={() => isEditing ? handleSave() : setIsEditing(true)} className={isEditing ? "bg-gradient-primary" : ""}>
              {isEditing ? <><Save className="h-4 w-4 mr-2" />Save</> : <><Edit className="h-4 w-4 mr-2" />Edit</>}
            </Button>
          </div>
        </div>

        <div className="mt-20 grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-lg font-semibold mb-6">Profile Information</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} disabled={!isEditing} className="h-12 bg-secondary" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={profile?.email || ""} disabled className="h-12 bg-secondary" />
                </div>
                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Textarea value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} disabled={!isEditing} className="min-h-[100px] bg-secondary resize-none" />
                </div>
                
                {/* Payment Details Section */}
                <div className="pt-4 border-t border-border">
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Payment Details
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Payout Method</Label>
                      <Select 
                        value={formData.payout_method} 
                        onValueChange={(value) => setFormData({...formData, payout_method: value})}
                        disabled={!isEditing}
                      >
                        <SelectTrigger className="h-12 bg-secondary">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paypal">PayPal</SelectItem>
                          <SelectItem value="usdc_solana">USDC (Solana)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {formData.payout_method === "paypal" && (
                      <div className="space-y-2">
                        <Label>PayPal Email</Label>
                        <Input 
                          value={formData.payout_email} 
                          onChange={(e) => setFormData({...formData, payout_email: e.target.value})} 
                          disabled={!isEditing} 
                          placeholder="your@paypal.email"
                          className="h-12 bg-secondary" 
                        />
                      </div>
                    )}
                    
                    {formData.payout_method === "usdc_solana" && (
                      <div className="space-y-2">
                        <Label>Solana Wallet Address</Label>
                        <Input 
                          value={formData.solana_wallet_address} 
                          onChange={(e) => setFormData({...formData, solana_wallet_address: e.target.value})} 
                          disabled={!isEditing} 
                          placeholder="Your Solana wallet address"
                          className="h-12 bg-secondary font-mono text-sm" 
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-lg font-semibold mb-6">Stats</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {statItems.map((stat) => (
                  <div key={stat.label} className="text-center p-4 rounded-lg bg-secondary/50">
                    <div className="text-2xl font-bold text-primary">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-card border border-border">
              <h3 className="font-semibold mb-4">Account Info</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 rounded-lg bg-primary/10"><User className="h-4 w-4 text-primary" /></div>
                  <div>
                    <div className="text-muted-foreground">Role</div>
                    <div className="font-medium capitalize">{role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 rounded-lg bg-primary/10"><Mail className="h-4 w-4 text-primary" /></div>
                  <div>
                    <div className="text-muted-foreground">Referral Code</div>
                    <div className="font-medium">{profile?.referral_code}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Referral Section */}
            <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-4">
                <Share2 className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Invite Friends</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Share your referral link and earn when your friends join!
              </p>
              <div className="flex gap-2">
                <Input 
                  value={referralLink} 
                  readOnly 
                  className="bg-background/50 text-xs" 
                />
                <Button 
                  size="icon" 
                  variant="outline"
                  onClick={copyReferralLink}
                  className="shrink-0"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;
