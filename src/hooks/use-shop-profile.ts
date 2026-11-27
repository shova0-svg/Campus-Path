import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { ShopProfile } from "@/lib/shop";
import { getMyShopProfile } from "@/lib/repo/shop";

export interface ShopProfileError {
  refId: string;
  message: string;
}

/** Profile is only "missing" after a successful query; errors never look like a missing shop. */
export function useShopProfile() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ShopProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<ShopProfileError | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      setProfile(await getMyShopProfile());
    } catch (e) {
      setProfile(null);
      setError({
        refId: crypto.randomUUID().slice(0, 8),
        message: e instanceof Error ? e.message : "Could not load profile / প্রোফাইল লোড করা যায়নি",
      });
    } finally {
      setChecked(true);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    setChecked(false);
    if (!user) {
      setProfile(null);
      setError(null);
      setLoading(false);
      setChecked(true);
      return;
    }
    setLoading(true);
    void refresh().finally(() => setLoading(false));
  }, [authLoading, user?.id, refresh]);

  return { profile, loading, checked, error, refresh };
}
