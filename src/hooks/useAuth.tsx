import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AppRole } from "@/lib/roles";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  referral_code: string | null;
  payout_method: string | null;
  payout_email: string | null;
  solana_wallet_address: string | null;
  clipper_tier: string | null;
  is_banned: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  isLoading: boolean;
  /** True once the profile + role load for the current user has finished
   * (successfully or not). Never treat `role === null` as "still loading"
   * once this is true — a user can legitimately have no role row (C-07). */
  roleLoaded: boolean;
  /** Non-null when the profile/role load failed. */
  roleError: string | null;
  signUp: (email: string, password: string, fullName: string, role: AppRole) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// `ensure_user_setup` is idempotent but must not run twice for the same
// user on one page load: onAuthStateChange(INITIAL_SESSION) and
// getSession() both fire at bootstrap (L-10). Track users already ensured
// and in-flight profile fetches at module level so concurrent callers
// share one run instead of racing.
const ensuredSetupFor = new Set<string>();
const profileFetchInFlight = new Map<string, Promise<void>>();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [roleLoaded, setRoleLoaded] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  const fetchProfile = async (userId: string) => {
    const inFlight = profileFetchInFlight.get(userId);
    if (inFlight) return inFlight;

    const run = (async () => {
      setRoleLoaded(false);
      setRoleError(null);
      try {
        // Self-heal missing profile/role/wallet records after database resets.
        // Deduped per user per page load (see module-level set above).
        if (!ensuredSetupFor.has(userId)) {
          ensuredSetupFor.add(userId);
          const { error: ensureError } = await supabase.rpc("ensure_user_setup" as never);
          if (ensureError) {
            console.error("[Auth] Error ensuring user setup:", ensureError);
          }
        }

        // Fetch profile and role in parallel for faster loading.
        // The role query uses limit(1) with an explicit order instead of
        // maybeSingle(): user_roles allows multiple rows per user, and
        // maybeSingle() errors on 2+ rows, which used to wipe the role (L-03).
        const [profileResult, roleResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .maybeSingle(),
          supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userId)
            .order("role")
            .limit(1),
        ]);

        if (profileResult.error) {
          console.error("[Auth] Error fetching profile:", profileResult.error);
          setProfile(null);
        } else if (profileResult.data) {
          setProfile(profileResult.data as Profile);
        } else {
          setProfile(null);
        }

        if (roleResult.error) {
          console.error("[Auth] Error fetching role:", roleResult.error);
          setRole(null);
          setRoleError(roleResult.error.message);
        } else if (roleResult.data && roleResult.data.length > 0) {
          setRole(roleResult.data[0].role as AppRole);
          setRoleError(null);
        } else {
          // Loaded successfully, but the user has no role row. That is a
          // real state (not "still loading") — callers must show an error
          // with retry/sign-out instead of spinning forever (C-07).
          setRole(null);
          setRoleError(null);
        }
      } catch (error) {
        console.error("[Auth] Error in fetchProfile:", error);
        setProfile(null);
        setRole(null);
        setRoleError(error instanceof Error ? error.message : "Failed to load your account.");
      } finally {
        setRoleLoaded(true);
      }
    })();

    profileFetchInFlight.set(userId, run);
    try {
      await run;
    } finally {
      if (profileFetchInFlight.get(userId) === run) {
        profileFetchInFlight.delete(userId);
      }
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    let cancelled = false;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (cancelled) return;
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // INITIAL_SESSION is handled by the getSession() bootstrap below;
          // every other event (sign-in, token refresh, user update)
          // re-resolves profile/role.
          if (event !== "INITIAL_SESSION") {
            void fetchProfile(session.user.id);
          }
        } else {
          setProfile(null);
          setRole(null);
          setRoleLoaded(true);
          setRoleError(null);
        }
      }
    );

    // THEN check for existing session. isLoading is cleared only AFTER the
    // profile + role load finishes — pages must never render a frame with
    // role === null while the role is still loading (C-07 / L-10).
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setSession(session);
      setUser(session?.user ?? null);
      void (async () => {
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setRoleLoaded(true);
        }
        if (!cancelled) setIsLoading(false);
      })();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string, role: AppRole) => {
    const redirectUrl = `${window.location.origin}/dashboard`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
    setRoleLoaded(true);
    setRoleError(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      role,
      isLoading,
      roleLoaded,
      roleError,
      signUp,
      signIn,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
