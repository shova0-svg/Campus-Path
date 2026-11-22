import {
  DAY_ORDER,
  DEFAULT_PERIODS,
  type ClassRoutine,
  type DayName,
  type Period,
  type RoutineEntry,
} from "@/lib/routine";
import type { Teacher } from "@/lib/teachers";

/** CSV columns: day, period, start_time, end_time, subject_code, subject_name, teacher, teacher_acronym, room */
export const CSV_TEMPLATE =
  "day,period,start_time,end_time,subject_code,subject_name,teacher,teacher_acronym,room\n" +
  "Sunday,1,8:00,8:45,28533,IT Support Services,MD. SORIAT ULLAH,MSU,1305\n" +
  "Sunday,2,8:45,9:30,28533,IT Support Services,MD. SORIAT ULLAH,MSU,1305\n";

export type CsvRow = {
  day: string;
  period: string;
  start_time: string;
  end_time: string;
  subject_code: string;
  subject_name: string;
  teacher: string;
  teacher_acronym: string;
  room: string;
};

const COLUMNS: (keyof CsvRow)[] = [
  "day",
  "period",
  "start_time",
  "end_time",
  "subject_code",
  "subject_name",
  "teacher",
  "teacher_acronym",
  "room",
];

/** Small RFC-4180-ish parser: handles quoted commas and escaped quotes. */
export function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((v) => v.trim())) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((v) => v.trim())) rows.push(row);

  const [header, ...data] = rows;
  if (!header) return [];
  const index = new Map(
    header.map((h, i) => [
      h
        .trim()
        .toLowerCase()
        .replace(/^\ufeff/, ""),
      i,
    ]),
  );
  return data.map((values) => {
    const out = {} as CsvRow;
    for (const col of COLUMNS) out[col] = (values[index.get(col) ?? -1] ?? "").trim();
    return out;
  });
}

export function normalizeDay(value: string): DayName | null {
  const key = value.trim().toLowerCase().slice(0, 3);
  return DAY_ORDER.find((d) => d.toLowerCase().startsWith(key)) ?? null;
}

export function buildImportedRoutine(
  instituteId: string,
  meta: { department: string; semester: number; group: string; shift: string; title: string },
  rows: CsvRow[],
): ClassRoutine {
  const timeToId = new Map<string, number>();
  const periods: Period[] = [];
  for (const row of rows) {
    if (!row.start_time || !row.end_time) continue;
    const time = `${row.start_time}-${row.end_time}`;
    if (!timeToId.has(time)) {
      const id = periods.length + 1;
      timeToId.set(time, id);
      periods.push({ id, label: String(id), time });
    }
  }
  if (periods.length === 0) periods.push(...DEFAULT_PERIODS.map((p) => ({ ...p })));

  const sorted = [...rows]
    .map((r) => ({ r, day: normalizeDay(r.day) }))
    .filter((x): x is { r: CsvRow; day: DayName } => x.day !== null)
    .sort(
      (a, b) =>
        DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day) ||
        Number(a.r.period) - Number(b.r.period),
    );

  const entries: RoutineEntry[] = [];
  for (const { r, day } of sorted) {
    const time = r.start_time && r.end_time ? `${r.start_time}-${r.end_time}` : "";
    const period = timeToId.get(time) ?? (Number(r.period) || 1);
    const last = entries[entries.length - 1];
    const canMerge =
      last &&
      last.day === day &&
      last.code === r.subject_code &&
      last.room === r.room &&
      period === last.endPeriod + 1;
    if (canMerge) {
      last.endPeriod = period;
      continue;
    }
    entries.push({
      id: `imp-${day}-${period}-${entries.length}`,
      day,
      period,
      endPeriod: period,
      code: r.subject_code,
      subject: r.subject_name || r.subject_code,
      teacher: r.teacher,
      acronym: r.teacher_acronym || r.subject_code,
      room: r.room,
    });
  }

  const now = new Date().toISOString();
  return {
    id: `routine-${instituteId}-${meta.department}-${meta.semester}-${meta.group || "x"}-${meta.shift}-${Date.now()}`,
    instituteId,
    semester: meta.semester,
    shift: meta.shift as ClassRoutine["shift"],
    department: meta.department,
    group: meta.group,
    title: meta.title,
    classStart: "",
    periods,
    entries,
    source: "imported",
    verified: false,
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
}

export type Warning = { level: "error" | "warning"; message: string; entryId?: string };

function similar(a: string, b: string): boolean {
  const x = a.toLowerCase().replace(/[^a-z0-9]/g, "");
  const y = b.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!x || !y) return false;
  return x.includes(y) || y.includes(x) || x.slice(0, 5) === y.slice(0, 5);
}

function tokenScore(a: string, b: string): number {
  const words = (s: string) =>
    s
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 2);
  const bw = words(b);
  return words(a).filter((w) => bw.includes(w)).length;
}

export function suggestTeacher(name: string, teachers: Teacher[]): Teacher | null {
  if (!name.trim()) return null;
  let best: Teacher | null = null;
  let bestScore = 0;
  for (const t of teachers) {
    const score = tokenScore(name, t.name);
    if (score > bestScore) {
      best = t;
      bestScore = score;
    }
  }
  return bestScore > 0 ? best : null;
}

export function validateImportedRoutine(
  routine: ClassRoutine,
  teachers: Teacher[],
  knownRooms: string[],
): Warning[] {
  const warnings: Warning[] = [];
  const rooms = new Set(knownRooms.map((r) => String(r).trim()));

  if (!routine.department.trim()) warnings.push({ level: "error", message: "Department required" });
  if (!routine.semester || routine.semester < 1)
    warnings.push({ level: "error", message: "Semester required" });
  if (!routine.shift.trim()) warnings.push({ level: "error", message: "Shift required" });
  if (routine.entries.length === 0)
    warnings.push({ level: "error", message: "No class rows found" });

  for (const e of routine.entries) {
    if (!e.code.trim() && !e.subject.trim())
      warnings.push({ level: "error", message: "Empty class cell", entryId: e.id });
    if (!e.teacher.trim()) {
      const suggestion = suggestTeacher(e.subject, teachers);
      warnings.push({
        level: "warning",
        message: suggestion
          ? `Teacher missing — did you mean ${suggestion.name}?`
          : "Teacher missing",
        entryId: e.id,
      });
    } else if (!teachers.some((t) => tokenScore(e.teacher, t.name) >= 2)) {
      const suggestion = suggestTeacher(e.teacher, teachers);
      warnings.push({
        level: "warning",
        message: suggestion
          ? `Teacher "${e.teacher}" not in directory — closest: ${suggestion.name}`
          : `Teacher "${e.teacher}" not in directory`,
        entryId: e.id,
      });
    }
    if (e.room.trim() && !rooms.has(e.room.trim()))
      warnings.push({
        level: "warning",
        message: `Unknown room ${e.room} (will be created)`,
        entryId: e.id,
      });

    const start = routine.periods.find((p) => p.id === e.period)?.time.split("-")[0] ?? "";
    const end = routine.periods.find((p) => p.id === e.endPeriod)?.time.split("-")[1] ?? "";
    if (!/^\d{1,2}:\d{2}$/.test(start.trim()) || !/^\d{1,2}:\d{2}$/.test(end.trim()))
      warnings.push({ level: "error", message: "Invalid time range", entryId: e.id });
  }

  // Overlapping periods on the same day.
  for (const day of DAY_ORDER) {
    const dayEntries = routine.entries.filter((e) => e.day === day);
    for (let i = 0; i < dayEntries.length; i++) {
      for (let j = i + 1; j < dayEntries.length; j++) {
        const a = dayEntries[i]!;
        const b = dayEntries[j]!;
        if (a.period <= b.endPeriod && b.period <= a.endPeriod)
          warnings.push({
            level: "error",
            message: `Overlapping periods on ${day}: ${a.acronym} and ${b.acronym}`,
            entryId: b.id,
          });
      }
    }
  }

  return warnings;
}

export function missingRoomsFromRoutine(routine: ClassRoutine, knownRooms: string[]): string[] {
  const rooms = new Set(knownRooms.map((r) => String(r).trim()));
  return [...new Set(routine.entries.map((e) => e.room.trim()).filter((r) => r && !rooms.has(r)))];
}
