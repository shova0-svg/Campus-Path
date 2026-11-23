import type { Journey } from "@/lib/student";
import { removePushSubscription, savePushSubscription, subscriptionToRow } from "@/lib/repo/push";
import { supabase } from "@/integrations/supabase/client";

const KEY = "sohoj-rasta-notify-enabled";

export function notificationsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KEY) === "1";
}

function setEnabled(value: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, value ? "1" : "0");
}

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

/** iOS needs the PWA installed to the home screen before Web Push works. */
export function needsHomeScreenHint(): boolean {
  if (typeof navigator === "undefined" || typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  const ios =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return ios && !window.matchMedia("(display-mode: standalone)").matches;
}

export async function enableNotifications(): Promise<boolean> {
  if (!pushSupported()) return false;
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;
  setEnabled(true);

  // Real Web Push when VAPID public key is configured.
  const publicKey = import.meta.env["VITE_VAPID_PUBLIC_KEY"] as string | undefined;
  if (publicKey) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });
      const { data } = await supabase.auth.getSession();
      if (data.session?.user)
        await savePushSubscription(data.session.user.id, subscriptionToRow(sub));
      window.localStorage.setItem("sohoj-rasta-push-endpoint", sub.endpoint);
    } catch {
      // Keep the local fallback if push subscribe fails.
    }
  }
  return true;
}

export async function disableNotifications(): Promise<void> {
  setEnabled(false);
  const endpoint = window.localStorage.getItem("sohoj-rasta-push-endpoint");
  if (endpoint) {
    try {
      const registration = await navigator.serviceWorker?.ready;
      const sub = await registration.pushManager.getSubscription();
      if (sub?.endpoint === endpoint) await sub.unsubscribe();
      await removePushSubscription(endpoint);
    } catch {
      /* ignore */
    }
    window.localStorage.removeItem("sohoj-rasta-push-endpoint");
  }
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob(base64.replace(/-/g, "+").replace(/_/g, "/") + padding);
  return new Uint8Array([...raw].map((c) => c.charCodeAt(0)));
}

function fire(title: string, body: string, url?: string): void {
  const show = () => {
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "SHOW_NOTIFICATION",
        title,
        body,
        url,
      });
    } else {
      new Notification(title, { body, icon: "/icons/icon-192.png", data: { url } });
    }
  };
  show();
}

/** Local notification for a newly published notice (works while the app is open). */
export function showNoticeNotification(title: string, noticeTitle: string, url: string): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  fire(title, noticeTitle.slice(0, 140), url);
}

/** Schedules class reminders while the app is open (no Firebase needed). */
export function scheduleJourneyReminders(journey: Journey): () => void {
  if (!notificationsEnabled() || typeof window === "undefined") return () => {};
  const timers: number[] = [];
  const now = new Date();

  function at(clock: string | null, title: string, body: string) {
    if (!clock) return;
    const [h, m] = clock.split(":").map(Number);
    if (h == null || m == null || !Number.isFinite(h) || !Number.isFinite(m)) return;
    const when = new Date(now);
    when.setHours(h, m, 0, 0);
    const delay = when.getTime() - now.getTime();
    if (delay <= 0 || delay > 12 * 60 * 60 * 1000) return;
    timers.push(window.setTimeout(() => fire(title, body), delay));
  }

  if (journey.current) {
    at(
      journey.currentEndsAt,
      "Current class ends",
      `${journey.current.subject.name} · room ${journey.current.block.room} — ${journey.current.subject.teacher}`,
    );
  }
  at(
    journey.leaveAt,
    "Next Class Journey",
    journey.sameRoom
      ? `Next class ${journey.next?.subject.name ?? ""} — same room / একই রুম, হাঁটতে হবে না.`
      : `Leave now — ${journey.next?.subject.name ?? "next class"} in room ${journey.next?.block.room ?? ""}. Walk ${journey.walkingMinutes} min.`,
  );
  at(
    journey.nextStartsAt,
    "Next class starts",
    `${journey.next?.subject.name ?? ""} · ${journey.next?.subject.teacher ?? ""} · room ${journey.next?.block.room ?? ""}`,
  );

  return () => timers.forEach((t) => window.clearTimeout(t));
}
