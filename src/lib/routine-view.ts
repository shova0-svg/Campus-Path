import { ROUTINES, type Shift } from "@/lib/routine";

export const ROUTINE_VIEW_KEY = "routine-view-v2";

/** 1, 3, 4 and 6 have data in both shifts; 2 and 5 are shown but not selectable. */
export const SELECTABLE_SEMESTERS = [1, 2, 3, 4, 5, 6] as const;
export const SELECTABLE_SHIFTS: Shift[] = [1, 2];

export interface RoutineViewSelection {
  institute: string;
  department: string;
  semester: number;
  shift: Shift;
}

export function hasRoutine(semester: number, shift: Shift = 1): boolean {
  return ROUTINES.some((r) => r.semester === semester && r.shift === shift);
}

/** Ignores old/invalid values (including routine-view-v1) and falls back to the profile. */
export function readRoutineView(
  raw: string | null,
  profileSemester: number | null = null,
  profileShift: Shift = 1,
): RoutineViewSelection {
  const fallback: RoutineViewSelection = {
    institute: "rpi",
    department: "cst",
    semester: profileSemester && profileSemester >= 1 && profileSemester <= 6 ? profileSemester : 1,
    shift: profileShift,
  };
  if (!raw) return fallback;
  try {
    const value = JSON.parse(raw) as Partial<RoutineViewSelection>;
    const semester = Number(value.semester);
    const shift = Number(value.shift);
    if (
      !Number.isInteger(semester) ||
      !SELECTABLE_SEMESTERS.some((s) => s === semester) ||
      !SELECTABLE_SHIFTS.includes(shift as Shift) ||
      typeof value.institute !== "string" ||
      typeof value.department !== "string"
    )
      return fallback;
    return {
      institute: value.institute,
      department: value.department,
      semester,
      shift: shift as Shift,
    };
  } catch {
    return fallback;
  }
}

export function writeRoutineView(selection: RoutineViewSelection): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ROUTINE_VIEW_KEY, JSON.stringify(selection));
  } catch {
    /* storage blocked */
  }
}

export function routineForSemester(semester: number, shift: Shift = 1) {
  return ROUTINES.find((r) => r.semester === semester && r.shift === shift) ?? null;
}

export function routineForSelection(selection: RoutineViewSelection) {
  return routineForSemester(selection.semester, selection.shift);
}

export const NO_ROUTINE_MESSAGE =
  "এই সেমিস্টারের রুটিন এখনো যোগ করা হয়নি / Routine for this semester is not added yet.";
