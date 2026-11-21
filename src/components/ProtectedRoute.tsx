import { useAuth } from "@/hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";
import { AppRole } from "@/lib/roles";
import { ErrorState } from "@/components/ui/ErrorState";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, isLoading, roleLoaded, roleError, refreshProfile, signOut } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // For role-gated routes: wait for the role load to finish, then check access.
  if (allowedRoles) {
    // Role still loading — spinner is fine here because roleLoaded bounds it.
    if (!roleLoaded) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-muted-foreground">Verifying access...</p>
          </div>
        </div>
      );
    }
    // C-07: load finished but the role is missing or failed to load.
    // Never spin forever — show an error with a way out (retry / sign out).
    if (roleError || !role) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <ErrorState
              title="We couldn't verify your access"
              message={
                roleError
                  ? `Your account role couldn't be loaded (${roleError}). Try again, or sign out and sign back in.`
                  : "Your account doesn't have a role assigned yet, so we can't tell which pages you can open. Try again, or sign out and contact support if this keeps happening."
              }
              onRetry={() => void refreshProfile()}
              retryLabel="Retry"
            >
              <Button variant="outline" onClick={() => void signOut()}>
                Sign out
              </Button>
            </ErrorState>
          </div>
        </div>
      );
    }
    // Role loaded but not allowed
    if (!allowedRoles.includes(role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
