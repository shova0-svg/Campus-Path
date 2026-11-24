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
  acronym?: string;
  teacherPhone?: string;
  time?: string;
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

/** Shared identity helpers for teacher matching (no directory dependency). */
export function normalizeNoticeName(name: string): string {
  const prefixes = ["MD", "MST", "MRS", "MS", "DR", "ENGR"];
  const tokens = String(name ?? "")
    .toUpperCase()
    .replace(/[.,]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
  let i = 0;
  while (i < tokens.length && prefixes.includes(tokens[i] ?? "")) i++;
  return tokens.slice(i).join(" ");
}

export function normalizeNoticePhone(phone: string | undefined | null): string {
  if (!phone) return "";
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length === 13 && digits.startsWith("880")) return `0${digits.slice(3)}`;
  return digits;
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
  return {
    day: get("weekday"),
    minute: (Number(get("hour")) % 24) * 60 + Number(get("minute")),
  };
}

function shiftNumber(value: string): number {
  const s = String(value ?? "")
    .trim()
    .toLowerCase();
  return s === "2" || s === "2nd" || s === "second" || s === "evening" ? 2 : 1;
}

function shiftLabel(shift: string): string {
  return shiftNumber(shift) === 2 ? "2nd Shift / ২য় শিফট" : "1st Shift / ১ম শিফট";
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

function defaultWalkingMinutes(room: string): number {
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
    shiftNumber(routine.shift) === shiftNumber(profile.shift) &&
    dept(routine.department, profile.department) &&
    (!profile.group ||
      !routine.group ||
      routine.group.toUpperCase() === profile.group.toUpperCase())
  );
}

export function findRoutine(
  profile: ReminderProfile,
  routines: ReminderRoutine[],
): ReminderRoutine | null {
  return routines.find((r) => matches(profile, r)) ?? null;
}

/**
 * Reminders due right now. `walkMinutes` can be supplied by the caller (from
 * the campus building distances) so the notification carries real travel time.
 */
export function dueReminders(
  profile: ReminderProfile,
  routine: ReminderRoutine | null,
  now: Date,
  walkMinutes: (room: string) => number = defaultWalkingMinutes,
): DueReminder[] {
  if (!routine || !matches(profile, routine)) return [];
  const { day, minute } = dhakaNow(now);
  if (day === "Friday" || day === "Saturday") return [];

  const timeOf = (id: number) => range(routine.periods.find((p) => p.id === id)?.time);
  const entries = routine.entries.filter((e) => e.day === day).sort((a, b) => a.period - b.period);
  const out: DueReminder[] = [];
  const seen = new Set<string>();
  const semester = `Semester ${routine.semester}`;
  const shift = shiftLabel(routine.shift);

  const detail = (e: ReminderEntry, start: [number, number], end: [number, number]) =>
    `${e.subject} (${e.code}) · ${e.teacher}${e.acronym ? ` [${e.acronym}]` : ""} · Room ${e.room} · ${semester} · ${shift} · ${label(start[0])}-${label(end[1])}`;

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
    const key = `${routine.semester}-${shiftNumber(routine.shift)}-${day}-${e.code || e.subject}-${e.period}`;

    if (minute >= end[1] - 5 && minute <= end[1]) {
      add({
        kind: "class_ends_soon",
        classKey: key,
        title: "Class ends soon / ক্লাস শেষ হতে যাচ্ছে",
        body: `${detail(e, start, end)} — ends ${label(end[1])}`,
        url: "/student",
      });
    }
    if (minute >= start[0] - 5 && minute <= start[0]) {
      const walk = walkMinutes(e.room);
      add({
        kind: "class_starting_soon",
        classKey: key,
        title: "Class starting in 5 min / ৫ মিনিটে ক্লাস",
        body: `${detail(e, start, end)} — starts ${label(start[0])} · Walk ${walk} min, leave by ${label(start[0] - walk)}`,
        url: "/student",
      });
    }

    const next = entries[index + 1];
    if (!next) return; // last class of the day — no leave-now reminder
    const nextStart = timeOf(next.period);
    const nextEnd = timeOf(next.endPeriod);
    if (!nextStart || !nextEnd) return;
    const walk = walkMinutes(next.room);
    const leaveAt = nextStart[0] - walk;
    if (minute >= leaveAt - 1 && minute <= leaveAt + 1) {
      add({
        kind: "leave_now",
        classKey: `${routine.semester}-${shiftNumber(routine.shift)}-${day}-${next.code || next.subject}-${next.period}`,
        title: "Leave now / এখন বের হন",
        body: `Next: ${detail(next, nextStart, nextEnd)} — walk ${walk} min, leave by ${label(leaveAt)}`,
        url: "/student",
      });
    }
  });

  return out;
}
