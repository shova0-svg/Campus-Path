import type { Building } from "@/lib/campus-data";
import {
  blocksForDay,
  buildingIdForRoom,
  dhakaNow,
  ROUTINES,
  resolveBlock,
  type Day,
  type ResolvedBlock,
  type Routine,
} from "@/lib/routine";

export interface StudentProfile {
  email: string;
  name: string;
  instituteId: string;
  department: string;
  semester: number;
  /** Kept optional for existing saved profiles / DB rows; not used by the two CST routines. */
  group?: string;
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
      ...(p.group ? { group: p.group } : {}),
      shift: p.shift ?? "Morning",
    };
  } catch {
    return null;
  }
}

function isCst(department: string): boolean {
  const d = department.toLowerCase().trim();
  return (
    d === "cst" || d === "computer" || d.includes("computer science") || d.includes("কম্পিউটার")
  );
}

function isFirstShift(shift: string): boolean {
  const s = shift.trim().toLowerCase();
  return s === "" || s === "1" || s === "1st" || s === "morning" || s === "first";
}

/** RPI + CST + semester 1 or 3 + 1st shift → the matching routine; otherwise null. */
export function matchRoutine(
  profile: StudentProfile,
  routines: Routine[] = ROUTINES,
): Routine | null {
  if (profile.instituteId !== "rpi" || !isCst(profile.department) || !isFirstShift(profile.shift))
    return null;
  return routines.find((r) => r.semester === profile.semester) ?? null;
}

export interface Journey {
  routine: Routine;
  current: ResolvedBlock | null;
  next: ResolvedBlock | null;
  currentEndsAt: string | null;
  nextStartsAt: string | null;
  walkingMinutes: number;
  leaveAt: string | null;
  sameRoom: boolean;
  day: Day | null;
}

function clock(minute: number): string {
  const h = Math.floor(minute / 60) % 24;
  return `${String(h).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}

function walkingTime(room: string, buildings: Building[]): number {
  const building = buildings.find((b) => b.id === buildingIdForRoom(room));
  const meters = building?.distance["main-gate"] ?? 80;
  return Math.max(2, Math.round(meters / 12));
}

/** Next class day after `day`, skipping the Fri/Sat weekend. */
function nextClassDay(day: Day | null): Day {
  const order: Day[] = ["Sun", "Mon", "Tue", "Wed", "Thu"];
  if (day === null) return "Sun";
  const i = order.indexOf(day);
  return order[(i + 1) % order.length] ?? "Sun";
}

export function nextClassJourney(
  profile: StudentProfile,
  now: Date = new Date(),
  buildings: Building[] = [],
): Journey | null {
  const routine = matchRoutine(profile);
  if (!routine) return null;

  const { day, minute } = dhakaNow(now);
  const today = day ? blocksForDay(routine, day) : [];
  const current = today.find((b) => minute >= b.startMinute && minute <= b.endMinute) ?? null;
  const nextToday = today.find((b) => b.startMinute >= (current?.endMinute ?? minute)) ?? null;

  let next = nextToday;
  if (!next) {
    const following = nextClassDay(day);
    next = blocksForDay(routine, following)[0] ?? null;
  }

  const sameRoom = Boolean(current && next && current.block.room === next.block.room);
  const walk = next && !sameRoom ? walkingTime(next.block.room, buildings) : 0;
  const nextStartsAt = next ? next.startTime : null;

  return {
    routine,
    current,
    next,
    currentEndsAt: current ? current.endTime : null,
    nextStartsAt,
    walkingMinutes: walk,
    leaveAt: next && nextStartsAt ? clock(next.startMinute - walk) : null,
    sameRoom,
    day,
  };
}

/** Re-exported so the journey card and notify can render a resolved block uniformly. */
export { resolveBlock };
