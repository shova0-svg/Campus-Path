/** Pure usage aggregation for the admin Stats view. No Supabase imports. */

export const USAGE_EVENTS = [
  "app_open",
  "qr_scan",
  "search",
  "journey_view",
  "reminder_enabled",
] as const;
export type UsageEventName = (typeof USAGE_EVENTS)[number];

export interface UsageEvent {
  user_id: string | null;
  institute_id: string;
  event: string;
  meta: Record<string, unknown>;
  created_at: string;
}

export interface UsageStats {
  totalEvents: number;
  activeUsers: number;
  dailyActiveUsers: { day: string; count: number }[];
  topRooms: { room: string; count: number }[];
  qrScans: number;
  reminderOptIns: number;
  byEvent: Record<string, number>;
}

/** Asia/Dhaka calendar day key (UTC+6) so stats match the students' day. */
export function dayKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

export function inLastDays(iso: string, days: number, now: Date): boolean {
  const then = new Date(iso).getTime();
  const cutoff = now.getTime() - days * 24 * 60 * 60 * 1000;
  return then >= cutoff && then <= now.getTime() + 60_000;
}

export function aggregateUsage(events: UsageEvent[], days: number, now = new Date()): UsageStats {
  const recent = events.filter((e) => inLastDays(e.created_at, days, now));

  const daily = new Map<string, Set<string>>();
  const rooms = new Map<string, number>();
  const optedIn = new Set<string>();
  const byEvent: Record<string, number> = {};
  let qrScans = 0;

  for (const e of recent) {
    byEvent[e.event] = (byEvent[e.event] ?? 0) + 1;
    if (e.user_id) {
      const day = dayKey(e.created_at);
      if (!daily.has(day)) daily.set(day, new Set());
      daily.get(day)!.add(e.user_id);
    }
    if (e.event === "qr_scan") qrScans++;
    if (e.event === "reminder_enabled" && e.user_id) optedIn.add(e.user_id);
    if (e.event === "search") {
      const room = typeof e.meta?.["room"] === "string" ? e.meta["room"]!.trim() : "";
      if (room) rooms.set(room, (rooms.get(room) ?? 0) + 1);
    }
  }

  const allUsers = new Set(recent.map((e) => e.user_id).filter(Boolean) as string[]);

  return {
    totalEvents: recent.length,
    activeUsers: allUsers.size,
    dailyActiveUsers: [...daily.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, users]) => ({ day, count: users.size })),
    topRooms: [...rooms.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([room, count]) => ({ room, count })),
    qrScans,
    reminderOptIns: optedIn.size,
    byEvent,
  };
}
