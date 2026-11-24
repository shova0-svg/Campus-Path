import { useCallback, useEffect, useState } from "react";

const SUPABASE_URL =
  (typeof import.meta !== "undefined" ? import.meta.env["VITE_SUPABASE_URL"] : undefined) ??
  (typeof process !== "undefined" ? process.env["SUPABASE_URL"] : undefined) ??
  "";
const SUPABASE_KEY =
  (typeof import.meta !== "undefined"
    ? import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"]
    : undefined) ??
  (typeof process !== "undefined" ? process.env["SUPABASE_PUBLISHABLE_KEY"] : undefined) ??
  "";

const TIMEOUT_MS = 3500;

/** Real reachability probe — navigator.onLine alone is not enough in a WebView. */
export async function probeReachable(
  fetcher: typeof fetch = fetch,
  timeoutMs = TIMEOUT_MS,
): Promise<boolean> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return false;
  if (!SUPABASE_URL || !SUPABASE_KEY) return true; // no env in tests/SSR: don't cry wolf
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(`${SUPABASE_URL}/rest/v1/institutes?select=id&limit=1`, {
      headers: { apikey: SUPABASE_KEY },
      signal: controller.signal,
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export interface Connectivity {
  online: boolean;
  checking: boolean;
  check: () => Promise<boolean>;
}

/**
 * Shared connectivity state: optimistic by default, verified by a short request.
 * Re-checks on online/offline events, resume/focus, and can be called after a
 * failed request. Once a probe succeeds the banner hides immediately.
 */
export function useConnectivity(): Connectivity {
  const [online, setOnline] = useState(true);
  const [checking, setChecking] = useState(false);

  const check = useCallback(async (): Promise<boolean> => {
    setChecking(true);
    let ok = await probeReachable();
    if (!ok) {
      // One quick retry avoids flicker on flaky Wi-Fi / captive portals.
      await new Promise((resolve) => setTimeout(resolve, 600));
      ok = await probeReachable();
    }
    setOnline(ok);
    setChecking(false);
    return ok;
  }, []);

  useEffect(() => {
    void check();
    const onOnline = () => void check();
    const onOffline = () => setOnline(false);
    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("focus", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("focus", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [check]);

  return { online, checking, check };
}
