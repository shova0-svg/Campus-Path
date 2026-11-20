import type { CampusLocation } from "@/lib/campus-data";

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
    code: "2001",
    subject: "Engineering Drawing",
    teacher: "MD. ABDULLAH-AL-MAMUN",
    acronym: "AAM",
  },
  { code: "25711", subject: "Bangla-1", teacher: "MST. SHAHEYA SIDDIQUA", acronym: "SH" },
  { code: "25712", subject: "English-1", teacher: "MD. SHABIR HOSSAIN", acronym: "SH" },
  { code: "25911", subject: "Mathematics-1", teacher: "MD. ABDUL HOSSAIN", acronym: "AP" },
  { code: "25912", subject: "Physics-1", teacher: "SK. MAMUNUL ISLAM MIAHKURIR", acronym: "MNK" },
  {
    code: "25811",
    subject: "Computer Office Application",
    teacher: "MD. FAQUH HUSSAIN",
    acronym: "MFH",
  },
  { code: "26711", subject: "Basic Electricity", teacher: "MD. NOHOSIN", acronym: "MM" },
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
    ["25912", 1, 1, ""],
    ["25911", 3, 4, "2302"],
    ["25711", 4, 4, "2302"],
    ["26711", 6, 7, "2308"],
  ],
  Monday: [
    ["25711", 1, 2, "2302"],
    ["25811", 3, 3, "2302"],
    ["26711", 4, 4, "2306"],
  ],
  Tuesday: [
    ["25912", 1, 2, "2302"],
    ["25911", 4, 4, "2302"],
    ["25811", 5, 6, "2306"],
  ],
  Wednesday: [
    ["2001", 2, 3, "2306"],
    ["25911", 4, 4, "2302"],
    ["26711", 5, 6, "2306"],
  ],
  Thursday: [
    ["25712", 1, 2, "2302"],
    ["25912", 3, 4, "2302"],
    ["25811", 5, 6, "2306"],
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
    verified: false,
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
  return Array.isArray(saved) ? (saved as ClassRoutine[]) : DEFAULT_ROUTINES.map((r) => ({ ...r }));
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

/** Maps a room number to a floor: the leading digit (2 → 2nd floor, 5 → 5th, …). */
export function roomFloor(room: string): number {
  const n = Number(room.trim()[0]);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Rooms referenced by a routine but not yet in the room store. */
export function roomsFromRoutine(routine: ClassRoutine, instituteId: string): CampusLocation[] {
  const seen = new Set<string>();
  const rooms: CampusLocation[] = [];
  for (const entry of routine.entries) {
    const code = entry.room.trim();
    if (!code || seen.has(code)) continue;
    seen.add(code);
    rooms.push({
      id: routineRoomId(code),
      name: `Room ${code}`,
      nameBn: `রুম ${code}`,
      category: "classroom",
      buildingId: "academic",
      floor: roomFloor(code),
      turn: "right",
      landmark: "Academic Building corridor",
      side: "left",
      door: 1,
      custom: true,
      keywords: [code, "routine", "class"],
    });
  }
  return rooms.map((r) => ({ ...r, id: `${r.id}-${instituteId}` }));
}

export function classesInRoom(routines: ClassRoutine[], room: string): RoutineEntry[] {
  const code = room.replace(/^Room\s*/i, "").trim();
  return routines.flatMap((r) =>
    r.entries.filter((e) => e.room.trim() === code).map((e) => ({ ...e, id: `${r.id}-${e.id}` })),
  );
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
