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

const PREFIXES = ["MD", "MST", "MRS", "MS", "DR", "ENGR"];

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

function isSubset(shorter: string[], longer: string[]): boolean {
  return shorter.length > 0 && shorter.every((token) => longer.includes(token));
}

/** Exact normalized match first, then token-set match. Ambiguity returns null. */
export function resolveTeacher(name: string, directory: Teacher[] = TEACHERS): Teacher | null {
  const target = normalizeName(name);
  if (!target) return null;
  const targetTokens = target.split(" ");

  const exact = directory.filter((t) => normalizeName(t.name) === target);
  if (exact.length === 1) return exact[0] ?? null;
  if (exact.length > 1) return null;

  const candidates = directory.filter((t) => {
    const other = normalizeName(t.name).split(" ");
    return isSubset(
      targetTokens.length <= other.length ? targetTokens : other,
      targetTokens.length <= other.length ? other : targetTokens,
    );
  });
  return candidates.length === 1 ? (candidates[0] ?? null) : null;
}

/** For the match report: closest directory names when no single candidate wins. */
export function closestCandidates(
  name: string,
  directory: Teacher[] = TEACHERS,
  limit = 3,
): string[] {
  const target = normalizeName(name);
  const tokens = new Set(target.split(" "));
  return directory
    .map((t) => {
      const other = normalizeName(t.name).split(" ");
      const score = other.filter((token) => tokens.has(token)).length;
      return { name: t.name, score };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((c) => c.name);
}

/** Maps a resolved directory teacher id to the routine classes they teach. */
export function scheduleByTeacherId(
  directory: Teacher[] = TEACHERS,
  routines: Routine[] = ROUTINES,
): Map<string, TeacherSchedule & { routineName: string }> {
  const result = new Map<string, TeacherSchedule & { routineName: string }>();
  const names = [...new Set(routines.flatMap((r) => r.subjects.map((s) => s.teacher)))];
  for (const name of names) {
    const teacher = resolveTeacher(name, directory);
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

export interface ScheduledClass {
  semester: number;
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
}

export interface TeacherSchedule {
  classes: ScheduledClass[];
  now: ScheduledClass | null;
  next: ScheduledClass | null;
}

function toScheduled(block: ResolvedBlock, semester: number): ScheduledClass {
  return {
    semester,
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
  };
}

/** All blocks taught by this name across every routine, plus now/next in Asia/Dhaka. */
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
      classes.push(toScheduled(resolveBlock(routine, block), routine.semester));
    }
  }
  classes.sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.period - b.period);

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
