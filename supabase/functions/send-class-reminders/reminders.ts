/** Pure reminder computation. No Deno/Supabase imports — shared with unit tests. */

export interface ReminderProfile {
  semester: number;
  group: string;
  shift: string;
  department: string;
}

export interface ReminderEntry {
  day: string;
  period: number;
  endPeriod: number;
  code: string;
  subject: string;
  teacher: string;
  room: string;
}

export interface ReminderRoutine {
  semester: number;
  shift: string;
  department: string;
  group?: string;
  title?: string;
  periods: { id: number; time: string }[];
  entries: ReminderEntry[];
}

export type ReminderKind = "class_ends_soon" | "leave_now" | "class_starting_soon";

export interface DueReminder {
  kind: ReminderKind;
  classKey: string;
  title: string;
  body: string;
  url: string;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function dhakaNow(now: Date): { day: string; minute: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const hour = Number(get("hour")) % 24;
  const minute = Number(get("minute"));
  return { day: get("weekday"), minute: hour * 60 + minute };
}

function range(time: string | undefined): [number, number] | null {
  if (!time) return null;
  const [s, e] = time.split(/\s*[-–]\s*/);
  const sm = s?.match(/(\d{1,2}):(\d{2})/);
  const em = e?.match(/(\d{1,2}):(\d{2})/);
  if (!sm || !em) return null;
  let sh = Number(sm[1]);
  let eh = Number(em[1]);
  if (eh < sh || (sh < 8 && eh < 8)) {
    sh += 12;
    eh += 12;
  }
  return [sh * 60 + Number(sm[2]), eh * 60 + Number(em[2])];
}

function label(minute: number): string {
  const h = Math.floor(minute / 60) % 24;
  return `${String(h).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}

function walkingMinutes(room: string): number {
  const code = room.trim();
  let meters = 80;
  if (code.startsWith("4")) meters = 95;
  else if (code.startsWith("5")) meters = 95;
  else if (code.startsWith("13")) meters = 85;
  else if (/^2/.test(code)) meters = 90;
  return Math.max(2, Math.round(meters / 12));
}

function matches(profile: ReminderProfile, routine: ReminderRoutine): boolean {
  const dept = (a: string, b: string) =>
    a.toLowerCase().includes(b.toLowerCase()) || b.toLowerCase().includes(a.toLowerCase());
  return (
    routine.semester === profile.semester &&
    routine.shift.toLowerCase() === profile.shift.toLowerCase() &&
    dept(routine.department, profile.department) &&
    (!profile.group ||
      !routine.group ||
      routine.group.toUpperCase() === profile.group.toUpperCase() ||
      !!routine.title?.toLowerCase().includes(`group ${profile.group.toLowerCase()}`))
  );
}

export function findRoutine(
  profile: ReminderProfile,
  routines: ReminderRoutine[],
): ReminderRoutine | null {
  const candidates = routines.filter((r) => matches(profile, r));
  const grouped = candidates.filter((r) =>
    r.title?.toLowerCase().includes(`group ${profile.group.toLowerCase()}`),
  );
  return grouped[0] ?? candidates[0] ?? null;
}

/** Returns the reminders due right now (within a ~1 minute window). */
export function dueReminders(
  profile: ReminderProfile,
  routine: ReminderRoutine | null,
  now: Date,
): DueReminder[] {
  if (!routine || !matches(profile, routine)) return [];
  const { day, minute } = dhakaNow(now);
  if (day === "Friday" || day === "Saturday") return [];

  const timeOf = (id: number) => range(routine.periods.find((p) => p.id === id)?.time);

  const entries = routine.entries.filter((e) => e.day === day).sort((a, b) => a.period - b.period);
  const out: DueReminder[] = [];
  const seen = new Set<string>();

  const add = (r: DueReminder) => {
    const key = `${r.kind}-${r.classKey}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(r);
  };

  entries.forEach((e, index) => {
    const start = timeOf(e.period);
    const end = timeOf(e.endPeriod);
    if (!start || !end) return;
    const key = `${day}-${e.code || e.subject}-${e.period}`;
    const detail = `${e.subject} · ${e.teacher} · Room ${e.room}`;

    if (minute >= end[1] - 5 && minute <= end[1]) {
      add({
        kind: "class_ends_soon",
        classKey: key,
        title: "Class ends soon",
        body: `${detail} — ends ${label(end[1])}`,
        url: "/student",
      });
    }
    if (minute >= start[0] - 5 && minute <= start[0]) {
      add({
        kind: "class_starting_soon",
        classKey: key,
        title: "Class starting in 5 min",
        body: `${detail} — starts ${label(start[0])}`,
        url: "/student",
      });
    }

    const next = entries[index + 1];
    if (!next) return; // last class of the day — no leave-now reminder
    const nextStart = timeOf(next.period);
    if (!nextStart) return;
    const walk = walkingMinutes(next.room);
    const leaveAt = nextStart[0] - walk;
    if (minute >= leaveAt - 1 && minute <= leaveAt + 1) {
      add({
        kind: "leave_now",
        classKey: `${day}-${next.code || next.subject}-${next.period}`,
        title: "Next Class Journey",
        body: `Leave now — ${next.subject} in Room ${next.room}. Walk ${walk} min.`,
        url: "/student",
      });
    }
  });

  return out;
}
