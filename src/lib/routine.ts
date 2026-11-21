import type { CampusLocation } from "@/lib/campus-data";
import type { LocationStore } from "@/lib/admin";

/* ---------------- Models ---------------- */

export type DayName =
  "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";

export const DAY_ORDER: DayName[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export type Shift = "Morning" | "Evening" | "Day" | "Night";

export interface Period {
  id: number;
  label: string;
  time: string;
}

export interface RoutineEntry {
  id: string;
  day: DayName;
  /** First period of the class (a merged class spans period → endPeriod). */
  period: number;
  endPeriod: number;
  code: string;
  subject: string;
  teacher: string;
  acronym: string;
  room: string;
}

export interface ClassRoutine {
  id: string;
  instituteId: string;
  semester: number;
  shift: Shift;
  department: string;
  title: string;
  classStart: string;
  classLoad?: number;
  periods: Period[];
  entries: RoutineEntry[];
  /** seeded = typed from the notice board, imported = parsed from pasted text, admin = edited in app. */
  source: "seeded" | "imported" | "admin";
  /** Original upload/ref file name, when one was supplied. */
  file?: string;
  /** Image-imported routines should be checked by the campus admin. */
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_PERIODS: Period[] = [
  { id: 1, label: "1", time: "8:00-8:45" },
  { id: 2, label: "2", time: "8:45-9:30" },
  { id: 3, label: "3", time: "9:30-10:15" },
  { id: 4, label: "4", time: "10:15-11:00" },
  { id: 5, label: "5", time: "11:00-11:45" },
  { id: 6, label: "6", time: "11:45-12:30" },
  { id: 7, label: "7", time: "12:30-1:15" },
];

/* ---------------- Seed data (Rajshahi Polytechnic, CST) ---------------- */

const SUBJECT_3RD = [
  { code: "25811", subject: "Social Science", teacher: "SAMROZ NAHAR", acronym: "SN" },
  { code: "25922", subject: "Physics-II", teacher: "MST. NAZMUN NAHER", acronym: "NN" },
  { code: "25931", subject: "Mathematics-III", teacher: "ANJUMAN ARA", acronym: "AA" },
  {
    code: "28531",
    subject: "Application Development Using Python",
    teacher: "MD. SORIAT ULLAH",
    acronym: "MSU",
  },
  {
    code: "28532",
    subject: "Computer Graphics Design-II",
    teacher: "MD. AZIZUL AMAN AL AMIN",
    acronym: "A4",
  },
  {
    code: "28533",
    subject: "IT Support Services",
    teacher: "MD. ABDULLAH-AL-MAMUN",
    acronym: "AAM",
  },
  { code: "26831", subject: "Digital Electronics-I", teacher: "MD. NURUN NOBE", acronym: "MNN" },
];

const SUBJECT_1ST = [
  {
    code: "21011",
    subject: "Engineering Drawing",
    teacher: "MD. ABDULLAH-AL-MAMUN",
    acronym: "AAM",
  },
  { code: "25711", subject: "Bangla-I", teacher: "MST. RABEYA SIDDIQUA", acronym: "RS" },
  { code: "25712", subject: "English-I", teacher: "MD. SHIMUL HOSSAIN", acronym: "SH" },
  { code: "25911", subject: "Mathematics-I", teacher: "MD. ABDUR RAZZAK", acronym: "AR" },
  {
    code: "25912",
    subject: "Physics-I",
    teacher: "SYED MAHMUDUN NABI KHONDKER",
    acronym: "MNK",
  },
  {
    code: "28511",
    subject: "Computer Office Application",
    teacher: "MD. FARUQ HOSSAIN",
    acronym: "MFH",
  },
  { code: "26711", subject: "Basic Electricity", teacher: "MD. MOHOSIN", acronym: "MM" },
];

type Cell = [code: string, period: number, endPeriod: number, room: string];

function makeEntries(
  prefix: string,
  subjects: typeof SUBJECT_3RD,
  cells: Record<DayName, Cell[]>,
): RoutineEntry[] {
  return DAY_ORDER.flatMap((day) =>
    (cells[day] ?? []).map(([code, period, endPeriod, room], i) => {
      const s = subjects.find((x) => x.code === code);
      return {
        id: `${prefix}-${day.toLowerCase()}-${period}-${i}`,
        day,
        period,
        endPeriod,
        code,
        subject: s?.subject ?? code,
        teacher: s?.teacher ?? "—",
        acronym: s?.acronym ?? code,
        room,
      };
    }),
  );
}

const THIRD_SEM_CELLS: Record<DayName, Cell[]> = {
  Sunday: [
    ["28533", 2, 2, "2302"],
    ["25922", 3, 4, "2106"],
    ["28533", 5, 5, "2306"],
    ["25931", 6, 7, "2306"],
  ],
  Monday: [
    ["28533", 1, 3, "1305"],
    ["25811", 4, 4, "1305"],
    ["28531", 5, 7, "1308"],
  ],
  Tuesday: [
    ["25931", 1, 2, "2302"],
    ["26831", 3, 3, "2302"],
    ["25922", 4, 4, "2302"],
    ["28532", 5, 7, "1305"],
  ],
  Wednesday: [
    ["26831", 1, 2, "5201"],
    ["25922", 3, 3, "1305"],
    ["28533", 4, 5, "1305"],
  ],
  Thursday: [
    ["25931", 1, 2, "2306"],
    ["25922", 3, 3, "2306"],
    ["28533", 4, 4, "2306"],
    ["28531", 5, 5, "2306"],
    ["25922", 6, 6, "2306"],
    ["26831", 7, 7, "2306"],
  ],
  Friday: [],
  Saturday: [],
};

const FIRST_SEM_CELLS: Record<DayName, Cell[]> = {
  Sunday: [
    ["25912", 1, 2, "2106"],
    ["25911", 3, 4, "2302"],
    ["26711", 5, 6, "5208"],
  ],
  Monday: [
    ["25911", 1, 2, "2302"],
    ["25711", 3, 3, "2302"],
    ["28511", 5, 6, "2301"],
    ["26711", 7, 7, "3109"],
  ],
  Tuesday: [
    ["25912", 2, 2, "2306"],
    ["26711", 3, 3, "2306"],
    ["25712", 4, 4, "2306"],
    ["21011", 5, 6, "2302"],
  ],
  Wednesday: [
    ["28511", 2, 2, "1308"],
    ["25711", 4, 4, "2303"],
    ["25912", 5, 5, "2303"],
    ["26711", 6, 6, "2303"],
  ],
  Thursday: [
    ["25712", 1, 1, "2303"],
    ["25911", 2, 3, "2303"],
    ["25912", 4, 4, "2305"],
    ["21011", 5, 7, "2305"],
  ],
  Friday: [],
  Saturday: [],
};

const STAMP = "2026-11-20T00:00:00.000Z";

export const DEFAULT_ROUTINES: ClassRoutine[] = [
  {
    id: "rpi-cst-1-morning",
    instituteId: "rpi",
    semester: 1,
    shift: "Morning",
    department: "Computer Science & Technology",
    title: "1st Semester · Morning Shift · CST",
    classStart: "11-10-2026",
    classLoad: 33,
    periods: DEFAULT_PERIODS,
    entries: makeEntries("rpi1", SUBJECT_1ST, FIRST_SEM_CELLS),
    source: "seeded",
    verified: true,
    createdAt: STAMP,
    updatedAt: STAMP,
  },
  {
    id: "rpi-cst-3-morning",
    instituteId: "rpi",
    semester: 3,
    shift: "Morning",
    department: "Computer Science & Technology",
    title: "3rd Semester · Morning Shift · CST",
    classStart: "27-09-2026",
    classLoad: 34,
    periods: DEFAULT_PERIODS,
    entries: makeEntries("rpi3", SUBJECT_3RD, THIRD_SEM_CELLS),
    source: "seeded",
    verified: true,
    createdAt: STAMP,
    updatedAt: STAMP,
  },
];

/* ---------------- Storage ---------------- */

export const ROUTINE_STORE_KEY = "sohoj-rasta-routines-v1";

function safeParse(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function parseRoutineStore(raw: string | null): ClassRoutine[] {
  const saved = safeParse(raw);
  if (!Array.isArray(saved)) return DEFAULT_ROUTINES.map((r) => ({ ...r }));
  // Seeded routines are refreshed from code so corrections reach existing devices.
  // Admin-created or admin-edited routines (source !== "seeded") are preserved.
  const seeded = DEFAULT_ROUTINES.map((r) => ({ ...r }));
  const kept = (saved as ClassRoutine[]).filter(
    (r) => r && !seeded.some((d) => d.id === r.id && r.source === "seeded"),
  );
  const freshSeeded = seeded.filter((d) => !kept.some((r) => r.id === d.id));
  return [...freshSeeded, ...kept];
}

export function upsertRoutine(list: ClassRoutine[], routine: ClassRoutine): ClassRoutine[] {
  const i = list.findIndex((r) => r.id === routine.id);
  if (i < 0) return [routine, ...list];
  return list.map((r, idx) => (idx === i ? routine : r));
}

export function deleteRoutine(list: ClassRoutine[], id: string): ClassRoutine[] {
  return list.filter((r) => r.id !== id);
}

/* ---------------- Auto parse pasted routine text ---------------- */

const DAY_TOKENS: Record<string, DayName> = {
  sunday: "Sunday",
  sun: "Sunday",
  monday: "Monday",
  mon: "Monday",
  tuesday: "Tuesday",
  tue: "Tuesday",
  wednesday: "Wednesday",
  wed: "Wednesday",
  thursday: "Thursday",
  thu: "Thursday",
  friday: "Friday",
  fri: "Friday",
  saturday: "Saturday",
  sat: "Saturday",
};

function parseCell(raw: string, day: DayName, period: number, prefix: string): RoutineEntry | null {
  const parts = raw
    .trim()
    .split(/[\s,|]+/)
    .filter(Boolean);
  if (parts.length === 0) return null;
  const code = parts.find((p) => /^\d{4,5}$/.test(p)) ?? parts[0] ?? "";
  const room = [...parts].reverse().find((p) => /^\d{3,4}$/.test(p) && p !== code) ?? "";
  const acronym = parts.find((p) => /^[A-Za-z]{1,5}$/.test(p) && p !== code && p !== room) ?? code;
  return {
    id: `${prefix}-${day.toLowerCase()}-${period}-${Math.random().toString(36).slice(2, 7)}`,
    day,
    period,
    endPeriod: period,
    code,
    subject: code,
    teacher: "—",
    acronym,
    room,
  };
}

/**
 * Parses pasted routine text into entries. Accepted lines:
 *   "Sunday"                       → sets the current day
 *   "1: 28533 MSU 2302"            → period 1 cell
 *   "1 8:00-8:45 28533 MSU 2302"   → period with time header
 *   "Sunday\t28533 MSU\t25922 NN"  → tab separated day row
 */
export function parseRoutineText(text: string, prefix = "import"): RoutineEntry[] {
  const entries: RoutineEntry[] = [];
  let day: DayName | null = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || /^(period|day|sl|day\/time)/i.test(line)) continue;

    const dayOnly = line.replace(/:$/, "").toLowerCase();
    const matchedDay = DAY_TOKENS[dayOnly];
    if (matchedDay) {
      day = matchedDay;
      continue;
    }

    const labeled = line.match(/^(\d{1,2})\s*[:.)-]?\s*(.*)$/);
    if (labeled && day) {
      const period = Number(labeled[1]);
      const rest = (labeled[2] ?? "").replace(/^\d{1,2}:\d{2}\s*[-–]\s*\d{1,2}:\d{2}\s*/, "");
      const cell = parseCell(rest, day, period, prefix);
      if (cell) entries.push(cell);
      continue;
    }

    if (line.includes("\t") && day) {
      const cells = line.split("\t");
      cells.forEach((cell, i) => {
        const parsed = parseCell(cell, day as DayName, i + 1, prefix);
        if (parsed && parsed.code) entries.push(parsed);
      });
      continue;
    }

    if (day && /[A-Za-z0-9]/.test(line)) {
      const cells = line.split(/\s{3,}|\s{2,}/);
      cells.forEach((cell, i) => {
        const parsed = parseCell(cell, day as DayName, i + 1, prefix);
        if (parsed && parsed.code) entries.push(parsed);
      });
    }
  }
  return entries;
}

/* ---------------- Rooms derived from routine cells ---------------- */

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

/** Human-readable breakdown, e.g. "Building 1 · 3rd Floor · Room 05". */
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

/** Sorts rooms by building → floor → room number; other rooms keep their relative order at the end. */
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
  const n = Number(code.replace(/[^0-9]/g, ""));
  if (!Number.isFinite(n)) return "academic";
  if (n >= 1301 && n <= 1308) return "computer";
  if ((n >= 2101 && n <= 2107) || (n >= 2201 && n <= 2206) || (n >= 2301 && n <= 2306)) {
    return "non-departmental";
  }
  if (code.trim().startsWith("5")) return "electrical";
  return "academic";
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

function makeRoutineRoom(code: string, instituteId: string): CampusLocation {
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
    ...range(5201, 5208),
  ].map((code) => makeRoutineRoom(code, instituteId));
}

export function classesInRoom(routines: ClassRoutine[], room: string): RoutineEntry[] {
  const code = room.replace(/^Room\s*/i, "").trim();
  return routines.flatMap((r) =>
    r.entries.filter((e) => e.room.trim() === code).map((e) => ({ ...e, id: `${r.id}-${e.id}` })),
  );
}

/** Adds rooms referenced by every saved routine to the room store (idempotent). */
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
      // Migrate rooms saved by older versions (floor used to be the first digit).
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

function timeToMinutes(time: string, isEnd: boolean): number {
  const match = time.match(/(\d{1,2}):(\d{2})/);
  if (!match) return 0;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  // "12:30-1:15" → the end time is 13:15, not 01:15.
  if (isEnd && hours < 8) hours += 12;
  return hours * 60 + minutes;
}

/** Classes happening in a room right now, based on the wall clock and routine periods. */
export function currentClassesInRoom(
  routines: ClassRoutine[],
  room: string,
  now: Date = new Date(),
): RoutineEntry[] {
  const code = room.replace(/^Room\s*/i, "").trim();
  const day = DAY_ORDER[now.getDay()];
  if (!day) return [];
  const current = now.getHours() * 60 + now.getMinutes();
  return routines.flatMap((routine) => {
    const period = routine.periods.find((p) => {
      const [start, end] = p.time.split(/\s*[-–]\s*/);
      return (
        start &&
        end &&
        current >= timeToMinutes(start, false) &&
        current <= timeToMinutes(end, true)
      );
    });
    if (!period) return [];
    return routine.entries
      .filter(
        (e) =>
          e.room.trim() === code &&
          e.day === day &&
          period.id >= e.period &&
          period.id <= e.endPeriod,
      )
      .map((e) => ({ ...e, id: `${routine.id}-now-${e.id}` }));
  });
}

/** Classes happening anywhere on campus right now (for the home overview). */
export function currentClasses(routines: ClassRoutine[], now: Date = new Date()): RoutineEntry[] {
  return routines.flatMap((routine) => {
    const allRooms = new Set(routine.entries.map((e) => e.room).filter(Boolean));
    return [...allRooms].flatMap((room) => currentClassesInRoom([routine], room, now));
  });
}

/* ---------------- Cloud OCR adapter (ready for Lovable Cloud) ---------------- */

/**
 * Configure VITE_ROUTINE_OCR_URL to a Lovable Cloud edge function that accepts
 * a multipart upload (file + semester/shift/department) and returns
 * { entries, subjects?, classStart?, classLoad? }. Until then the local
 * paste/auto-parser is used and uploads are kept as a reference file name.
 */
export interface OcrResult {
  entries: RoutineEntry[];
  classStart?: string;
  classLoad?: number;
}

export function hasOcrEndpoint(): boolean {
  return Boolean(import.meta.env["VITE_ROUTINE_OCR_URL"]);
}

export async function uploadRoutineForOCR(file: File, prefix: string): Promise<OcrResult | null> {
  const url = import.meta.env["VITE_ROUTINE_OCR_URL"] as string | undefined;
  if (!url) return null;
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(url, { method: "POST", body: form });
  if (!res.ok) throw new Error(`OCR failed (${res.status})`);
  const data = (await res.json()) as OcrResult;
  return {
    ...data,
    entries: (data.entries ?? []).map((e, i) => ({ ...e, id: `${prefix}-ocr-${i}` })),
  };
}
