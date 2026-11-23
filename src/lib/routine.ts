import type { CampusLocation } from "@/lib/campus-data";
import type { LocationStore } from "@/lib/admin";
import {
  DAYS,
  PERIODS,
  PERIOD_TIMES,
  ROUTINES,
  type Block,
  type Day,
  type Period,
  type Routine,
  type Subject,
} from "@/data/rpi-cst-routines";

/* ---------------- New model (single source of truth) ---------------- */

export {
  DAYS,
  PERIODS,
  PERIOD_TIMES,
  ROUTINES,
  ROUTINE_1,
  ROUTINE_3,
  ROUTINE_4,
  ROUTINE_6,
} from "@/data/rpi-cst-routines";
export type { Block, Day, Period, Routine, Subject } from "@/data/rpi-cst-routines";

export type DayName =
  "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";

const DAY_NAMES: Record<Day, DayName> = {
  Sun: "Sunday",
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
};

/** A block with its subject resolved and its times computed. */
export interface ResolvedBlock {
  block: Block;
  subject: Subject;
  startMinute: number;
  endMinute: number;
  startTime: string;
  endTime: string;
  time12: string;
}

export function subjectFor(routine: Routine, code: string): Subject | undefined {
  return routine.subjects.find((s) => s.code === code);
}

function clock(minute: number): string {
  const h = Math.floor(minute / 60) % 24;
  return `${String(h).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}

export function format12(minute: number): string {
  const h24 = Math.floor(minute / 60) % 24;
  const m = minute % 60;
  const suffix = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function periodMinutes(period: Period, end = false): number {
  const [from, to] = PERIOD_TIMES[period].split("-");
  const [h, m] = (end ? to : from)!.split(":").map(Number);
  return h! * 60 + m!;
}

export function blockRange(block: Block): [number, number] {
  return [periodMinutes(block.startPeriod), periodMinutes(block.endPeriod, true)];
}

export function resolveBlock(routine: Routine, block: Block): ResolvedBlock {
  const subject = subjectFor(routine, block.subjectCode);
  if (!subject) throw new Error(`Unknown subject code in routine data: ${block.subjectCode}`);
  const [startMinute, endMinute] = blockRange(block);
  return {
    block,
    subject,
    startMinute,
    endMinute,
    startTime: clock(startMinute),
    endTime: clock(endMinute),
    time12: `${format12(startMinute)} - ${format12(endMinute)}`,
  };
}

export function blocksForDay(routine: Routine, day: Day): ResolvedBlock[] {
  return routine.blocks
    .filter((b) => b.day === day)
    .sort((a, b) => a.startPeriod - b.startPeriod)
    .map((b) => resolveBlock(routine, b));
}

/** Asia/Dhaka (UTC+6) — never uses the device timezone. */
export function dhakaNow(now: Date = new Date()): {
  day: Day | null;
  weekday: string;
  minute: number;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekday = get("weekday");
  const day = (["Sun", "Mon", "Tue", "Wed", "Thu"] as const).find((d) => d === weekday) ?? null;
  return { day, weekday, minute: (Number(get("hour")) % 24) * 60 + Number(get("minute")) };
}

/* ---------------- Derived compatibility view ----------------
 * The rest of the app (room pages, QR, admin lists, sync) still consumes the
 * legacy ClassRoutine shape. These objects are DERIVED from ROUTINES above —
 * they are not a second dataset. There is no other routine data in the repo.
 */

export interface PeriodRow {
  id: number;
  label: string;
  time: string;
}

export interface RoutineEntry {
  id: string;
  day: DayName;
  period: number;
  endPeriod: number;
  code: string;
  subject: string;
  teacher: string;
  acronym: string;
  room: string;
  /** Semester and period time, used by room/teacher pages. */
  semester?: number;
  time?: string;
}

export interface ClassRoutine {
  id: string;
  instituteId: string;
  semester: number;
  shift: string;
  department: string;
  title: string;
  classStart: string;
  classLoad: number;
  periods: PeriodRow[];
  entries: RoutineEntry[];
  source: "seeded";
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_PERIODS: PeriodRow[] = PERIODS.map((p) => ({
  id: p,
  label: String(p),
  time: PERIOD_TIMES[p],
}));

function derive(routine: Routine): ClassRoutine {
  const byCode = new Map(routine.subjects.map((s) => [s.code, s]));
  const stamp = `${routine.classStart}T00:00:00.000Z`;
  return {
    id: `rpi-cst-${routine.semester}-1`,
    instituteId: routine.institute,
    semester: routine.semester,
    shift: "Morning",
    department: "Computer Science & Technology",
    title: routine.title,
    classStart: routine.classStart.split("-").reverse().join("-"),
    classLoad: routine.classLoad,
    periods: DEFAULT_PERIODS,
    entries: routine.blocks.map((b, i) => {
      const s = byCode.get(b.subjectCode)!;
      return {
        id: `${routine.institute}-cst-${routine.semester}-${i}`,
        day: DAY_NAMES[b.day],
        period: b.startPeriod,
        endPeriod: b.endPeriod,
        code: s.code,
        subject: s.name,
        teacher: s.teacher,
        acronym: s.acronym,
        room: b.room,
        semester: routine.semester,
        time: `${PERIOD_TIMES[b.startPeriod].split("-")[0]}-${PERIOD_TIMES[b.endPeriod].split("-")[1]}`,
      };
    }),
    source: "seeded",
    verified: true,
    createdAt: stamp,
    updatedAt: stamp,
  };
}

/** Four derived routines. Rebuilt from source on every load. */
export const DEFAULT_ROUTINES: ClassRoutine[] = ROUTINES.map(derive);

/* ---------------- Storage (v2 — v1 cache is never read) ---------------- */

export const ROUTINE_STORE_KEY = "sohoj-rasta-routines-v3";

/**
 * Stored/remote rows can never hide a routine that exists in code: missing ids
 * are merged in, and a code routine always wins over a stale copy of the same id.
 * Admin-created routines (other ids) are preserved.
 */
export function mergeWithCodeRoutines(stored: ClassRoutine[] | null): ClassRoutine[] {
  const byId = new Map((stored ?? []).filter((r) => r && r.id).map((r) => [r.id, r]));
  for (const routine of DEFAULT_ROUTINES) byId.set(routine.id, routine);
  return [...byId.values()];
}

export function parseRoutineStore(raw: string | null): ClassRoutine[] {
  const parsed = (() => {
    try {
      const value: unknown = raw ? JSON.parse(raw) : null;
      return Array.isArray(value) ? (value as ClassRoutine[]) : null;
    } catch {
      return null;
    }
  })();
  return mergeWithCodeRoutines(parsed);
}

export function upsertRoutine(list: ClassRoutine[], routine: ClassRoutine): ClassRoutine[] {
  const i = list.findIndex((r) => r.id === routine.id);
  if (i < 0) return [routine, ...list];
  return list.map((r, idx) => (idx === i ? routine : r));
}

export function deleteRoutine(list: ClassRoutine[], id: string): ClassRoutine[] {
  return list.filter((r) => r.id !== id);
}

/* ---------------- Room-number logic (unchanged) ---------------- */

/** Builds a room id from its number, e.g. "2302" → "routine-room-2302". */
export function routineRoomId(room: string): string {
  return `routine-room-${room.replace(/[^0-9A-Za-z]/g, "")}`;
}

/** Room-code convention: 1305 → building 1, floor 3, room 05. */
export interface RoomCodeParts {
  buildingNo: number;
  floor: number;
  roomNo: number;
}

export function parseRoomCode(room: string): RoomCodeParts | null {
  const code = room.replace(/^Room\s*/i, "").trim();
  const match = code.match(/^(\d)(\d)(\d{2})$/);
  if (!match) return null;
  return {
    buildingNo: Number(match[1]),
    floor: Number(match[2]),
    roomNo: Number(match[3]),
  };
}

/** The floor is the second digit of a 4-digit room code (1305 → 3). */
export function roomFloor(room: string): number {
  return parseRoomCode(room)?.floor ?? 0;
}

export function formatRoomCode(room: string): string | null {
  const parts = parseRoomCode(room);
  if (!parts) return null;
  return `Building ${parts.buildingNo} · ${parts.floor}${ordinalSuffix(parts.floor)} Floor · Room ${String(
    parts.roomNo,
  ).padStart(2, "0")}`;
}

function ordinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] ?? s[v] ?? s[0] ?? "th";
}

export function sortRooms<T extends CampusLocation>(rooms: T[]): T[] {
  return [...rooms].sort((a, b) => {
    const pa = parseRoomCode(a.name);
    const pb = parseRoomCode(b.name);
    if (!pa && !pb) return 0;
    if (!pa) return 1;
    if (!pb) return -1;
    return (
      pa.buildingNo - pb.buildingNo ||
      pa.floor - pb.floor ||
      pa.roomNo - pb.roomNo ||
      a.name.localeCompare(b.name)
    );
  });
}

/** Maps a routine room number to its building at Rajshahi Polytechnic. */
export function buildingIdForRoom(code: string): string {
  const room = code.trim();
  const n = Number(room.replace(/[^0-9]/g, ""));
  if (!Number.isFinite(n)) return "academic";
  if (room.startsWith("4")) return "civil";
  if (room.startsWith("5")) return "electrical";
  if (room.startsWith("13")) return "computer";
  if ((n >= 2101 && n <= 2107) || (n >= 2201 && n <= 2206) || (n >= 2301 && n <= 2306)) {
    return "non-departmental";
  }
  return "academic";
}

export function makeRoutineRoom(code: string, instituteId: string): CampusLocation {
  const parts = parseRoomCode(code);
  return {
    id: `${routineRoomId(code)}-${instituteId}`,
    name: `Room ${code}`,
    nameBn: `রুম ${code}`,
    category: "classroom",
    buildingId: buildingIdForRoom(code),
    floor: parts?.floor ?? 0,
    ...(parts ? { buildingNo: parts.buildingNo, roomNo: parts.roomNo } : {}),
    turn: "right",
    landmark: parts ? `Building ${parts.buildingNo} corridor` : "Academic Building corridor",
    side: "left",
    door: parts?.roomNo ?? 1,
    custom: true,
    keywords: [code, "routine", "class", `building ${parts?.buildingNo ?? ""}`],
  };
}

function range(from: number, to: number): string[] {
  return Array.from({ length: to - from + 1 }, (_, i) => String(from + i));
}

/** Every room in the RPI room-number ranges, not only the ones used by a routine. */
export function allCampusRooms(instituteId: string): CampusLocation[] {
  if (instituteId !== "rpi") return [];
  return [
    ...range(1301, 1308),
    ...range(2101, 2107),
    ...range(2201, 2206),
    ...range(2301, 2306),
    ...range(3101, 3109),
    ...range(3201, 3209),
    ...range(3401, 3406),
    ...range(4101, 4106),
    ...range(5101, 5108),
    ...range(5201, 5211),
  ].map((code) => makeRoutineRoom(code, instituteId));
}

/** Rooms referenced by a routine but not yet in the room store. */
export function roomsFromRoutine(routine: ClassRoutine, instituteId: string): CampusLocation[] {
  const seen = new Set<string>();
  const rooms: CampusLocation[] = [];
  for (const entry of routine.entries) {
    const code = entry.room.trim();
    if (!code || seen.has(code)) continue;
    seen.add(code);
    rooms.push(makeRoutineRoom(code, instituteId));
  }
  return rooms;
}

export function classesInRoom(routines: ClassRoutine[], room: string): RoutineEntry[] {
  const code = room.replace(/^Room\s*/i, "").trim();
  return routines.flatMap((r) =>
    r.entries.filter((e) => e.room.trim() === code).map((e) => ({ ...e, id: `${r.id}-${e.id}` })),
  );
}

/** Adds rooms referenced by the two routines to the room store (idempotent). */
export function mergeRoutineRooms(store: LocationStore, routines: ClassRoutine[]): LocationStore {
  let next = { ...store };
  const catalog = allCampusRooms("rpi");
  if (catalog.length > 0) {
    const list = [...(next["rpi"] ?? [])];
    for (const room of catalog) {
      if (!list.some((l) => l.id === room.id)) list.unshift(room);
    }
    next = { ...next, rpi: list };
  }
  for (const routine of routines) {
    const list = next[routine.instituteId] ?? [];
    for (const room of roomsFromRoutine(routine, routine.instituteId)) {
      const index = list.findIndex((l) => l.id === room.id);
      if (index < 0) {
        list.unshift(room);
        continue;
      }
      const existing = list[index];
      if (!existing) continue;
      list[index] = {
        ...existing,
        ...room,
        ...(existing.directions ? { directions: existing.directions } : {}),
        ...(existing.walkingSteps != null ? { walkingSteps: existing.walkingSteps } : {}),
      };
    }
    next = { ...next, [routine.instituteId]: list };
  }
  return next;
}

/** Kept for the derived view: parses the legacy "8:00-8:45" / "12:30-1:15" strings. */
export function periodRange(time: string): [number, number] | null {
  const [start, end] = time.split(/\s*[-–]\s*/);
  const sm = start?.match(/(\d{1,2}):(\d{2})/);
  const em = end?.match(/(\d{1,2}):(\d{2})/);
  if (!sm || !em) return null;
  let sh = Number(sm[1]);
  let eh = Number(em[1]);
  if (eh < sh || (sh < 8 && eh < 8)) {
    sh += 12;
    eh += 12;
  }
  return [sh * 60 + Number(sm[2]), eh * 60 + Number(em[2])];
}

/** Classes happening in a room right now (Asia/Dhaka). */
export function currentClassesInRoom(
  routines: ClassRoutine[],
  room: string,
  now: Date = new Date(),
): RoutineEntry[] {
  const code = room.replace(/^Room\s*/i, "").trim();
  const { weekday, minute } = dhakaNow(now);
  const day = DAY_ORDER_NAMES[weekday];
  if (!day) return [];
  return routines.flatMap((routine) =>
    routine.entries
      .filter((e) => {
        if (e.room.trim() !== code || e.day !== day) return false;
        const start = periodRange(routine.periods.find((p) => p.id === e.period)?.time ?? "");
        const end = periodRange(routine.periods.find((p) => p.id === e.endPeriod)?.time ?? "");
        return start && end && minute >= start[0] && minute <= end[1];
      })
      .map((e) => ({ ...e, id: `${routine.id}-now-${e.id}` })),
  );
}

const DAY_ORDER_NAMES: Record<string, DayName> = {
  Sun: "Sunday",
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
};

/** Classes happening anywhere on campus right now (for the home overview). */
export function currentClasses(routines: ClassRoutine[], now: Date = new Date()): RoutineEntry[] {
  return routines.flatMap((routine) => {
    const allRooms = new Set(routine.entries.map((e) => e.room).filter(Boolean));
    return [...allRooms].flatMap((room) => currentClassesInRoom([routine], room, now));
  });
}
