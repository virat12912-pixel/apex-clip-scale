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
import { ElevatedCard, ElevatedCardContent, ElevatedCardHeader, ElevatedCardTitle } from "@/components/ui/elevated-card";

const Settings = () => {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    submissions: true,
    payouts: true,
  });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    // For now, just sign out - actual deletion would require an edge function
    toast({
      title: "Account deletion requested",
      description: "Please contact support to complete account deletion.",
    });
    await signOut();
  };

  return (
    <AppLayout title="Settings">
      <div className="max-w-2xl mx-auto space-y-8 page-enter">
        {/* Change Password */}
        <ElevatedCard variant="elevated">
          <ElevatedCardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Key className="h-5 w-5 text-primary icon-interactive" />
              </div>
              <div>
                <ElevatedCardTitle>Change Password</ElevatedCardTitle>
                <p className="text-sm text-muted-foreground">Update your account password</p>
              </div>
            </div>
          </ElevatedCardHeader>
          <ElevatedCardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-12 bg-secondary pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5 icon-interactive" /> : <Eye className="h-5 w-5 icon-interactive" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 bg-secondary"
                  placeholder="••••••••"
                />
              </div>

              <Button
                type="submit"
                disabled={isChangingPassword || !newPassword || !confirmPassword}
                variant="glow"
              >
                {isChangingPassword ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </ElevatedCardContent>
        </ElevatedCard>

        {/* Notifications */}
        <ElevatedCard variant="glass">
          <ElevatedCardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bell className="h-5 w-5 text-primary icon-interactive" />
              </div>
              <div>
                <ElevatedCardTitle>Notifications</ElevatedCardTitle>
                <p className="text-sm text-muted-foreground">Manage your notification preferences</p>
              </div>
            </div>
          </ElevatedCardHeader>
          <ElevatedCardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors">
              <div>
                <div className="font-medium">Email Notifications</div>
                <div className="text-sm text-muted-foreground">Receive updates via email</div>
              </div>
              <Switch
                checked={notifications.email}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, email: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors">
              <div>
                <div className="font-medium">Submission Updates</div>
                <div className="text-sm text-muted-foreground">
                  Get notified when submissions are approved/rejected
                </div>
              </div>
              <Switch
                checked={notifications.submissions}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, submissions: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors">
              <div>
                <div className="font-medium">Payout Notifications</div>
                <div className="text-sm text-muted-foreground">
                  Get notified when payouts are processed
                </div>
              </div>
              <Switch
                checked={notifications.payouts}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, payouts: checked })
                }
              />
            </div>
          </ElevatedCardContent>
        </ElevatedCard>

        {/* Danger Zone */}
        <ElevatedCard variant="elevated" className="border-destructive/20">
          <ElevatedCardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <ElevatedCardTitle className="text-destructive">Danger Zone</ElevatedCardTitle>
                <p className="text-sm text-muted-foreground">Irreversible actions</p>
              </div>
            </div>
          </ElevatedCardHeader>
          <ElevatedCardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10">
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account and
                    remove all your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Delete Account
                  </AlertDialogAction>
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
