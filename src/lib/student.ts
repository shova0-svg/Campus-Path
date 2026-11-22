import type { Building } from "@/lib/campus-data";
import {
  buildingIdForRoom,
  DAY_ORDER,
  periodRange,
  type ClassRoutine,
  type RoutineEntry,
} from "@/lib/routine";

export interface StudentProfile {
  email: string;
  name: string;
  instituteId: string;
  department: string;
  semester: number;
  group: string;
  shift: string;
}

export const STUDENT_KEY = "sohoj-rasta-student-v1";

export function parseStudent(raw: string | null): StudentProfile | null {
  if (!raw) return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object") return null;
    const p = data as Partial<StudentProfile>;
    if (!p.email || !p.instituteId) return null;
    return {
      email: p.email,
      name: p.name ?? "",
      instituteId: p.instituteId,
      department: p.department ?? "",
      semester: Number(p.semester) || 1,
      group: p.group ?? "A",
      shift: p.shift ?? "Morning",
    };
  } catch {
    return null;
  }
}

export function matchRoutine(
  profile: StudentProfile,
  routines: ClassRoutine[],
): ClassRoutine | null {
  const candidates = routines.filter(
    (r) =>
      r.instituteId === profile.instituteId &&
      r.semester === profile.semester &&
      r.shift.toLowerCase() === profile.shift.toLowerCase() &&
      (!profile.department ||
        r.department.toLowerCase().includes(profile.department.toLowerCase()) ||
        profile.department.toLowerCase().includes(r.department.toLowerCase())),
  );
  const grouped = candidates.filter((r) =>
    r.title.toLowerCase().includes(`group ${profile.group.toLowerCase()}`),
  );
  const plain = candidates.filter((r) => !r.title.toLowerCase().includes("group "));
  return grouped[0] ?? plain[0] ?? candidates[0] ?? null;
}

export interface Journey {
  routine: ClassRoutine;
  current: RoutineEntry | null;
  next: RoutineEntry | null;
  currentEndsAt: string | null;
  nextStartsAt: string | null;
  walkingMinutes: number;
  leaveAt: string | null;
  day: string;
}

function minutesToLabel(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function timeLabel(routine: ClassRoutine, period: number, end = false): string | null {
  const time = routine.periods.find((p) => p.id === period)?.time;
  const range = time ? periodRange(time) : null;
  return range ? minutesToLabel(end ? range[1] : range[0]) : null;
}

function walkingTime(room: string, buildings: Building[]): number {
  const id = buildingIdForRoom(room);
  const building = buildings.find((b) => b.id === id);
  const meters = building?.distance["main-gate"] ?? 80;
  return Math.max(2, Math.round(meters / 12));
}

export function nextClassJourney(
  profile: StudentProfile,
  routines: ClassRoutine[],
  buildings: Building[],
  now: Date = new Date(),
): Journey | null {
  const routine = matchRoutine(profile, routines);
  if (!routine) return null;

  const day = DAY_ORDER[now.getDay()];
  const minute = now.getHours() * 60 + now.getMinutes();
  const onDay = routine.entries.filter((e) => e.day === day).sort((a, b) => a.period - b.period);

  const current =
    onDay.find((e) => {
      const range = periodRange(routine.periods.find((p) => p.id === e.endPeriod)?.time ?? "");
      const start = periodRange(routine.periods.find((p) => p.id === e.period)?.time ?? "");
      return start && range && minute >= start[0] && minute <= range[1];
    }) ?? null;

  const next = onDay.find((e) => e.period > (current?.endPeriod ?? 0)) ?? null;

  const currentEndsAt = current ? timeLabel(routine, current.endPeriod, true) : null;
  const nextStartsAt = next ? timeLabel(routine, next.period) : null;
  const walk = next ? walkingTime(next.room, buildings) : 0;
  const leaveAt =
    next && nextStartsAt
      ? minutesToLabel(
          Number(nextStartsAt.split(":")[0]) * 60 + Number(nextStartsAt.split(":")[1]) - walk,
        )
      : null;

  return {
    routine,
    current,
    next,
    currentEndsAt,
    nextStartsAt,
    walkingMinutes: walk,
    leaveAt,
    day: day ?? "Sunday",
  };
}
