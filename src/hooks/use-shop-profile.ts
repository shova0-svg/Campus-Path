import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { ShopProfile } from "@/lib/shop";
import { getMyShopProfile } from "@/lib/repo/shop";

export function useShopProfile() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ShopProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const next = await getMyShopProfile();
    setProfile(next);
    return next;
  }, []);

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
