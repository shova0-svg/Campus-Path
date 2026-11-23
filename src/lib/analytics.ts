import { supabase } from "@/integrations/supabase/client";
import { db } from "@/lib/repo/client";
import { parseStudent, STUDENT_KEY } from "@/lib/student";
import type { UsageEventName } from "@/lib/stats";

/**
 * Fire-and-forget usage logging. Never blocks the UI and never throws — a failed
 * analytics call must not break the app or show a blank screen.
 */
export function logEvent(event: UsageEventName, meta: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  void (async () => {
    try {
      const profile = parseStudent(window.localStorage.getItem(STUDENT_KEY));
      const { data } = await supabase.auth.getSession();
      // The RLS policy only allows authenticated inserts; don't generate a 401 for guests.
      if (!data.session?.user) return;
      await db.from("usage_events").insert({
        user_id: data.session.user.id,
        institute_id: profile?.instituteId ?? "rpi",
        event,
        meta,
      });
    } catch {
      /* analytics is best-effort only */
    }
  })();
}
