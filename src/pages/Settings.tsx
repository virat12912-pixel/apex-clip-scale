import { useState } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Key, Bell, Trash2, Eye, EyeOff } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ElevatedCard, ElevatedCardContent, ElevatedCardHeader, ElevatedCardTitle } from "@/components/ui/elevated-card";

const Settings = () => {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [notifications, setNotifications] = useState({ email: true, submissions: true, payouts: true });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" }); return; }
    if (newPassword !== confirmPassword) { toast({ title: "Error", description: "Passwords do not match", variant: "destructive" }); return; }
    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Password updated", description: "Your password has been changed successfully." });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally { setIsChangingPassword(false); }
  };

  const handleDeleteAccount = async () => {
    toast({ title: "Account deletion requested", description: "Please contact support to complete account deletion." });
    await signOut();
  };

  return (
    <AppLayout title="Settings">
      <div className="max-w-2xl mx-auto space-y-6 page-enter">
        {/* Change Password */}
        <ElevatedCard variant="elevated" className="rounded-2xl">
          <ElevatedCardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 transition-transform duration-300 hover:scale-110">
                <Key className="h-5 w-5 text-primary" />
              </div>
              <div>
                <ElevatedCardTitle className="font-display">Change Password</ElevatedCardTitle>
                <p className="text-sm text-muted-foreground/50">Update your account password</p>
              </div>
            </div>
          </ElevatedCardHeader>
          <ElevatedCardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-muted-foreground/60">New Password</Label>
                <div className="relative">
                  <Input id="newPassword" type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-12 bg-card/50 border-border/30 rounded-xl pr-12" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors duration-200">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-muted-foreground/60">Confirm New Password</Label>
                <Input id="confirmPassword" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-12 bg-card/50 border-border/30 rounded-xl" placeholder="••••••••" />
              </div>
              <Button type="submit" disabled={isChangingPassword || !newPassword || !confirmPassword} className="bg-gradient-primary hover:opacity-90 glow-primary-sm btn-shimmer rounded-xl font-display font-bold">
                {isChangingPassword ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </ElevatedCardContent>
        </ElevatedCard>

        {/* Notifications */}
        <ElevatedCard variant="glass" className="rounded-2xl">
          <ElevatedCardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 transition-transform duration-300 hover:scale-110">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <ElevatedCardTitle className="font-display">Notifications</ElevatedCardTitle>
                <p className="text-sm text-muted-foreground/50">Manage your notification preferences</p>
              </div>
            </div>
          </ElevatedCardHeader>
          <ElevatedCardContent className="space-y-2">
            {[
              { key: "email", title: "Email Notifications", desc: "Receive updates via email" },
              { key: "submissions", title: "Submission Updates", desc: "Get notified when submissions are approved/rejected" },
              { key: "payouts", title: "Payout Notifications", desc: "Get notified when payouts are processed" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 rounded-xl hover:bg-primary/3 transition-all duration-200">
                <div>
                  <div className="font-semibold text-sm">{item.title}</div>
                  <div className="text-xs text-muted-foreground/50">{item.desc}</div>
                </div>
                <Switch
                  checked={notifications[item.key as keyof typeof notifications]}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, [item.key]: checked })}
                />
              </div>
            ))}
          </ElevatedCardContent>
        </ElevatedCard>

        {/* Danger Zone */}
        <ElevatedCard variant="elevated" className="border-destructive/15 rounded-2xl">
          <ElevatedCardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <ElevatedCardTitle className="text-destructive font-display">Danger Zone</ElevatedCardTitle>
                <p className="text-sm text-muted-foreground/50">Irreversible actions</p>
              </div>
            </div>
          </ElevatedCardHeader>
          <ElevatedCardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="border-destructive/20 text-destructive hover:bg-destructive/10 rounded-xl">
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-display">Delete Account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account and remove all your data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90">Delete Account</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </ElevatedCardContent>
        </ElevatedCard>
      </div>
    </AppLayout>
  );
};

export default Settings;
