import { useState } from "react";
import { AppLayout } from "@/components/app/AppLayout";
import { 
  User, 
  Mail, 
  MapPin, 
  Calendar,
  Edit,
  Camera,
  Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john@example.com",
    location: "Los Angeles, CA",
    bio: "Professional clipper specializing in gaming and tech content. 3+ years of experience creating viral short-form content.",
    joinedDate: "January 2024",
    twitter: "@johndoe",
    discord: "johndoe#1234",
  });

  const stats = [
    { label: "Total Clips", value: "47" },
    { label: "Total Views", value: "1.2M" },
    { label: "Campaigns Joined", value: "12" },
    { label: "Success Rate", value: "94%" },
  ];

  return (
    <AppLayout title="My Profile">
      <div className="max-w-4xl mx-auto">
        {/* Profile header */}
        <div className="relative mb-8">
          {/* Cover */}
          <div className="h-32 sm:h-48 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
          
          {/* Avatar and info */}
          <div className="absolute -bottom-16 left-6 flex items-end gap-4">
            <div className="relative">
              <div className="w-28 h-28 rounded-2xl bg-gradient-primary flex items-center justify-center text-3xl font-bold text-primary-foreground border-4 border-background">
                JD
              </div>
              <button className="absolute -bottom-1 -right-1 p-2 rounded-full bg-primary text-primary-foreground">
                <Camera className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Edit button */}
          <div className="absolute bottom-4 right-4">
            <Button
              variant={isEditing ? "default" : "outline"}
              onClick={() => setIsEditing(!isEditing)}
              className={isEditing ? "bg-gradient-primary" : ""}
            >
              {isEditing ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="mt-20 grid lg:grid-cols-3 gap-6">
          {/* Main info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-lg font-semibold mb-6">Profile Information</h2>

              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      disabled={!isEditing}
                      className="h-12 bg-secondary border-border disabled:opacity-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      disabled={!isEditing}
                      className="h-12 bg-secondary border-border disabled:opacity-100"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    disabled={!isEditing}
                    className="h-12 bg-secondary border-border disabled:opacity-100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    disabled={!isEditing}
                    className="min-h-[100px] bg-secondary border-border resize-none disabled:opacity-100"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter</Label>
                    <Input
                      id="twitter"
                      value={profile.twitter}
                      onChange={(e) => setProfile({ ...profile, twitter: e.target.value })}
                      disabled={!isEditing}
                      className="h-12 bg-secondary border-border disabled:opacity-100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discord">Discord</Label>
                    <Input
                      id="discord"
                      value={profile.discord}
                      onChange={(e) => setProfile({ ...profile, discord: e.target.value })}
                      disabled={!isEditing}
                      className="h-12 bg-secondary border-border disabled:opacity-100"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-lg font-semibold mb-6">Performance Stats</h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center p-4 rounded-lg bg-secondary/50">
                    <div className="text-2xl font-bold text-primary">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick info */}
            <div className="p-6 rounded-xl bg-card border border-border">
              <h3 className="font-semibold mb-4">Quick Info</h3>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-muted-foreground">Member since</div>
                    <div className="font-medium">{profile.joinedDate}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-muted-foreground">Email</div>
                    <div className="font-medium">{profile.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-muted-foreground">Location</div>
                    <div className="font-medium">{profile.location}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Account status */}
            <div className="p-6 rounded-xl bg-card border border-border">
              <h3 className="font-semibold mb-4">Account Status</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Account Type</span>
                  <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    Clipper
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Verification</span>
                  <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                    Verified
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Payout Status</span>
                  <span className="px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;