import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { ShopProfile } from "@/lib/shop";
import { getMyShopProfile } from "@/lib/repo/shop";

export interface ShopProfileError {
  refId: string;
  message: string;
  status?: string;
  code?: string;
  hint?: string;
}

function toDetails(error: unknown): Omit<ShopProfileError, "refId"> {
  const e = error as Record<string, unknown> | null;
  return {
    message: e?.["message"]
      ? String(e["message"])
      : "Could not load profile / প্রোফাইল লোড করা যায়নি",
    ...(e?.["status"] ? { status: String(e["status"]) } : {}),
    ...(e?.["code"] ? { code: String(e["code"]) } : {}),
    ...(e?.["hint"] ? { hint: String(e["hint"]) } : {}),
  };
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
      const details = toDetails(e);
      const refId = crypto.randomUUID().slice(0, 8);
      // No tokens or keys here — only PostgREST status/code/message/hint.
      console.error("shop profile load failed", { refId, ...details });
      setProfile(null);
      setError({ refId, ...details });
    } finally {
      setChecked(true);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    const uid = user?.id;
    setChecked(false);
    if (!uid) {
      setProfile(null);
      setError(null);
      setLoading(false);
      setChecked(true);
      return;
    }
    setLoading(true);
    void refresh().finally(() => setLoading(false));
  }, [authLoading, user?.id, user, refresh]);

  return { profile, loading, checked, error, refresh };
}
