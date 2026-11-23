import {
  DAYS,
  dhakaNow,
  resolveBlock,
  ROUTINES,
  type Day,
  type ResolvedBlock,
  type Routine,
} from "@/lib/routine";
import { TEACHERS, teacherId, type Teacher } from "@/lib/teachers";
import { TEACHER_ALIASES } from "@/data/teacher-aliases";

const PREFIXES = ["MD", "MST", "MRS", "MS", "DR", "ENGR"];
const BN_DIGITS: Record<string, string> = {
  "০": "0",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9",
};

/** Uppercase, strip dots/commas/titles, collapse spaces and hyphens. */
export function normalizeName(name: string): string {
  const tokens = name
    .toUpperCase()
    .replace(/[.,]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
  let i = 0;
  while (i < tokens.length && PREFIXES.includes(tokens[i] ?? "")) i++;
  return tokens.slice(i).join(" ");
}

/** ASCII digits, +880/880 prefix → leading 0. Accepts Bangla digits. */
export function normalizePhone(phone: string | undefined | null): string {
  if (!phone) return "";
  const ascii = String(phone).replace(/[০-৯]/g, (d) => BN_DIGITS[d] ?? d);
  const digits = ascii.replace(/\D/g, "");
  if (digits.length === 13 && digits.startsWith("880")) return `0${digits.slice(3)}`;
  if (digits.length === 12 && digits.startsWith("880")) return `0${digits.slice(3)}`;
  return digits;
}

function significant(name: string): string[] {
  return normalizeName(name)
    .split(" ")
    .filter((t) => t.length >= 3);
}

function tokenSetMatch(a: string[], b: string[]): boolean {
  const shorter = a.length <= b.length ? a : b;
  const longer = a.length <= b.length ? b : a;
  return shorter.length >= 2 && shorter.every((token) => longer.includes(token));
}

function byPhone(phone: string, directory: Teacher[]): Teacher[] {
  const target = normalizePhone(phone);
  if (!target) return [];
  return directory.filter(
    (t) => normalizePhone(t.mobile) === target || normalizePhone(t.phoneOffice) === target,
  );
}

function byName(name: string, directory: Teacher[]): Teacher[] {
  const aliased = TEACHER_ALIASES[name.trim().toUpperCase()];
  const target = normalizeName(aliased ?? name);
  if (!target) return [];
  const exact = directory.filter((t) => normalizeName(t.name) === target);
  if (exact.length > 0) return exact;
  // An alias is a manual, verified mapping — never fall back to fuzzy matching it.
  if (aliased) return [];
  return directory.filter((t) => tokenSetMatch(significant(name), significant(t.name)));
}

/** Phone first, then exact name, then significant token-set. Ambiguity → null. */
export function resolveTeacher(
  name: string,
  phoneOrDirectory?: string | Teacher[],
  directory: Teacher[] = TEACHERS,
): Teacher | null {
  const phone = typeof phoneOrDirectory === "string" ? phoneOrDirectory : undefined;
  const teachers = Array.isArray(phoneOrDirectory) ? phoneOrDirectory : directory;

  const phoneMatches = phone ? byPhone(phone, teachers) : [];
  const nameMatches = byName(name, teachers);

  if (phoneMatches.length === 1) {
    if (nameMatches.length === 0) return phoneMatches[0] ?? null;
    if (nameMatches.length === 1 && teacherId(nameMatches[0]!) === teacherId(phoneMatches[0]!))
      return phoneMatches[0] ?? null;
    return null; // phone and name point to different people
  }
  if (phoneMatches.length > 1) return null;
  return nameMatches.length === 1 ? (nameMatches[0] ?? null) : null;
}

/** For the match report: closest directory names when no single candidate wins. */
export function closestCandidates(
  name: string,
  directory: Teacher[] = TEACHERS,
  limit = 3,
): string[] {
  const tokens = new Set(significant(name));
  return directory
    .map((t) => {
      const other = significant(t.name);
      const score = other.filter((token) => tokens.has(token)).length;
      return { name: t.name, score };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((c) => c.name);
}

export interface ScheduledClass {
  semester: number;
  shift: number;
  day: Day;
  period: number;
  endPeriod: number;
  subject: string;
  code: string;
  room: string;
  time12: string;
  startMinute: number;
  endMinute: number;
  teacher: string;
  acronym: string;
  teacherPhone?: string;
}

export interface TeacherSchedule {
  classes: ScheduledClass[];
  now: ScheduledClass | null;
  next: ScheduledClass | null;
}

function toScheduled(
  block: ResolvedBlock,
  semester: number,
  shift: number,
  phone?: string,
): ScheduledClass {
  return {
    semester,
    shift,
    day: block.block.day,
    period: block.block.startPeriod,
    endPeriod: block.block.endPeriod,
    subject: block.subject.name,
    code: block.subject.code,
    room: block.block.room,
    time12: block.time12,
    startMinute: block.startMinute,
    endMinute: block.endMinute,
    teacher: block.subject.teacher,
    acronym: block.subject.acronym,
    ...(phone ? { teacherPhone: phone } : {}),
  };
}

/** All blocks taught by this name across every routine; now/next use each shift's times. */
export function teacherSchedule(
  teacherName: string,
  routines: Routine[] = ROUTINES,
  now: Date = new Date(),
): TeacherSchedule {
  const target = normalizeName(teacherName);
  const classes: ScheduledClass[] = [];

  for (const routine of routines) {
    for (const block of routine.blocks) {
      const subject = routine.subjects.find((s) => s.code === block.subjectCode);
      if (!subject || normalizeName(subject.teacher) !== target) continue;
      classes.push(
        toScheduled(
          resolveBlock(routine, block),
          routine.semester,
          routine.shift,
          subject.teacherPhone,
        ),
      );
    }
  }
  classes.sort(
    (a, b) =>
      DAYS.indexOf(a.day) - DAYS.indexOf(b.day) ||
      a.startMinute - b.startMinute ||
      a.semester - b.semester,
  );

  const { day, minute } = dhakaNow(now);
  const today = day ? classes.filter((c) => c.day === day) : [];
  const current = today.find((c) => minute >= c.startMinute && minute <= c.endMinute) ?? null;
  const nextToday = today.find((c) => c.startMinute > minute) ?? null;
  let next = nextToday;
  if (!next) {
    for (let i = 1; i <= DAYS.length && !next; i++) {
      const dayIndex = day ? DAYS.indexOf(day) : -1;
      const upcoming = DAYS[(dayIndex + i) % DAYS.length];
      if (!upcoming) continue;
      next = classes.find((c) => c.day === upcoming) ?? null;
    }
  }
  return { classes, now: current, next };
}

/** Maps a resolved directory teacher id to all the routine classes they teach. */
export function scheduleByTeacherId(
  directory: Teacher[] = TEACHERS,
  routines: Routine[] = ROUTINES,
): Map<string, TeacherSchedule & { routineName: string }> {
  const result = new Map<string, TeacherSchedule & { routineName: string }>();
  const names = new Map<string, string>();
  for (const routine of routines) {
    for (const subject of routine.subjects) {
      if (!names.has(subject.teacher)) names.set(subject.teacher, subject.teacherPhone ?? "");
    }
  }
  for (const [name, phone] of names) {
    const teacher = resolveTeacher(name, phone, directory);
    if (!teacher || !teacherId(teacher)) continue;
    const schedule = teacherSchedule(name, routines);
    if (schedule.classes.length === 0) continue;
    const id = teacherId(teacher)!;
    const previous = result.get(id);
    if (!previous || schedule.classes.length > previous.classes.length) {
      result.set(id, { ...schedule, routineName: name });
    }
  }
  return result;
}

/** MA (1st shift MD. MOHON ALI vs 2nd shift Mohammad Ali) stays unresolved. */
export const POSSIBLE_SAME_PERSON = ["MA"];
