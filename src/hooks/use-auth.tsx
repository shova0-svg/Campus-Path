import { safeGet, safeSet, safeRemove } from "@/lib/storage";
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

const CACHE_KEY = "sohoj-rasta-auth-cache";

type CachedUser = { id: string; email: string; name: string };

function readCache(): CachedUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = safeGet(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CachedUser) : null;
  } catch {
    return null;
  }
}

function writeCache(user: User): void {
  try {
    const meta = user.user_metadata ?? {};
    const name =
      typeof meta["full_name"] === "string"
        ? meta["full_name"]
        : typeof meta["name"] === "string"
          ? meta["name"]
          : "";
    safeSet(
      CACHE_KEY,
      JSON.stringify({ id: user.id, email: user.email ?? "", name } satisfies CachedUser),
    );
  } catch {
    /* ignore */
  }
}

/** Offline fallback: a local, read-only identity so the app still opens. */
function offlineUser(): User | null {
  const cached = readCache();
  if (!cached) return null;
  return {
    id: cached.id,
    email: cached.email,
    app_metadata: {},
    user_metadata: { full_name: cached.name },
    aud: "authenticated",
    created_at: "",
  } as User;
}

async function loadDisplayName(user: User): Promise<string> {
  const cached = readCache();
  const fallback = cached?.name || (user.email ?? "").split("@")[0] || "Student";
  if (!navigator.onLine) return fallback;
  try {
    const { data } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();
    return data?.display_name || fallback;
  } catch {
    return fallback;
  }
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
      writeCache(next);
      window.setTimeout(() => {
        void loadDisplayName(next).then((name) => active && setDisplayName(name));
      }, 0);
    };

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED") return;
      apply(session?.user ?? (navigator.onLine ? null : offlineUser()));
    });

    // getSession() reads local storage — no network needed, so offline boot stays fast.
    void supabase.auth
      .getSession()
      .then(({ data: result }) =>
        apply(result.session?.user ?? (navigator.onLine ? null : offlineUser())),
      )
      .catch(() => apply(navigator.onLine ? null : offlineUser()));

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      safeRemove(CACHE_KEY);
    }
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
