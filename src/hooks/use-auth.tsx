import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthState {
  user: User | null;
  displayName: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  displayName: null,
  loading: true,
  signOut: async () => {},
});

async function loadDisplayName(user: User): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  return data?.display_name || (user.email ?? "").split("@")[0] || "Student";
}

/** Single place that listens to sign-in / sign-out for the whole app. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const apply = (next: User | null) => {
      if (!active) return;
      setUser(next);
      setLoading(false);
      if (!next) {
        setDisplayName(null);
        return;
      }
      // Defer the profile read so it never runs inside the auth callback.
      window.setTimeout(() => {
        loadDisplayName(next).then((name) => active && setDisplayName(name));
      }, 0);
    };
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED") return;
      apply(session?.user ?? null);
    });
    supabase.auth.getUser().then(({ data: res }) => apply(res.user ?? null));
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, displayName, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
