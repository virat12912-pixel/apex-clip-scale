import { useState } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { User, Mail, Edit, Save, Copy, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCreatorStats } from "@/hooks/useStats";
import { mapErrorToUserMessage, logError } from "@/lib/errorMapping";

const Profile = () => {
  const { profile, role, refreshProfile } = useAuth();
  const { data: stats } = useCreatorStats();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    bio: profile?.bio || "",
    payout_method: profile?.payout_method || "paypal",
    payout_email: profile?.payout_email || "",
  });

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update(formData)
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
            <div className="w-28 h-28 rounded-2xl bg-gradient-primary flex items-center justify-center text-3xl font-bold text-primary-foreground border-4 border-background">
              {profile?.full_name?.charAt(0) || "U"}
            </div>
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
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Payout Method</Label>
                    <Input value={formData.payout_method} onChange={(e) => setFormData({...formData, payout_method: e.target.value})} disabled={!isEditing} className="h-12 bg-secondary" />
                  </div>
                  <div className="space-y-2">
                    <Label>Payout Email</Label>
                    <Input value={formData.payout_email} onChange={(e) => setFormData({...formData, payout_email: e.target.value})} disabled={!isEditing} className="h-12 bg-secondary" />
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
