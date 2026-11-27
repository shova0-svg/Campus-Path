import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { ShopProfile } from "@/lib/shop";
import { getMyShopProfile } from "@/lib/repo/shop";
import { safeGet, safeSet } from "@/lib/storage";

const CACHE_KEY = "sohoj-rasta-shop-profile-v1";

function readCached(userId: string): ShopProfile | null {
  try {
    const raw = safeGet(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as { userId: string; profile: ShopProfile };
    return cached.userId === userId ? cached.profile : null;
  } catch {
    return null;
  }
}

export function useShopProfile() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ShopProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const next = await getMyShopProfile();
    if (next && user?.id) safeSet(CACHE_KEY, JSON.stringify({ userId: user.id, profile: next }));
    // A transient lookup failure must not send a real seller back to the gate.
    const resolved = next ?? (user ? readCached(user.id) : null);
    setProfile(resolved);
    return resolved;
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    void refresh().finally(() => setLoading(false));
  }, [authLoading, user?.id, refresh]);

  return { profile, loading, refresh };
}
