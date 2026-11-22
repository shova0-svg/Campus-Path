import type { Journey } from "@/lib/student";

const KEY = "sohoj-rasta-notify-enabled";

export function notificationsEnabled(): boolean {
  return window.localStorage.getItem(KEY) === "1";
}

function setEnabled(value: boolean): void {
  window.localStorage.setItem(KEY, value ? "1" : "0");
}

export async function enableNotifications(): Promise<boolean> {
  if (typeof Notification === "undefined") return false;
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;
  setEnabled(true);
  await navigator.serviceWorker?.ready;
  return true;
}

export function disableNotifications(): void {
  setEnabled(false);
}

function fire(title: string, body: string): void {
  const show = () => {
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "SHOW_NOTIFICATION", title, body });
    } else {
      new Notification(title, { body, icon: "/icon-192.png" });
    }
  };
  show();
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
      `${journey.current.subject} · room ${journey.current.room} — ${journey.current.teacher}`,
    );
  }
  at(
    journey.leaveAt,
    "Next Class Journey",
    `Leave now — ${journey.next?.subject ?? "next class"} in room ${journey.next?.room ?? ""}. Walk ${journey.walkingMinutes} min.`,
  );
  at(
    journey.nextStartsAt,
    "Next class starts",
    `${journey.next?.subject ?? ""} · ${journey.next?.teacher ?? ""} · room ${journey.next?.room ?? ""}`,
  );

  return () => timers.forEach((t) => window.clearTimeout(t));
}
