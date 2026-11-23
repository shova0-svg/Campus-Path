import { ROUTINES } from "@/lib/routine";

export const ROUTINE_VIEW_KEY = "routine-view-v1";

/** 1, 3, 4 and 6 have data; 2 and 5 are shown but not selectable. */
export const SELECTABLE_SEMESTERS = [1, 2, 3, 4, 5, 6] as const;
export const AVAILABLE_SEMESTERS = ROUTINES.map((r) => r.semester);

export function hasRoutine(semester: number): boolean {
  return ROUTINES.some((r) => r.semester === semester);
}

export function readRoutineView(raw: string | null, profileSemester: number | null = null): number {
  const parsed = Number(raw);
  if (Number.isInteger(parsed) && SELECTABLE_SEMESTERS.some((s) => s === parsed)) return parsed;
  return profileSemester && profileSemester >= 1 && profileSemester <= 6 ? profileSemester : 1;
}

export function writeRoutineView(semester: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ROUTINE_VIEW_KEY, String(semester));
  } catch {
    /* storage blocked */
  }
}

export function routineForSemester(semester: number) {
  return ROUTINES.find((r) => r.semester === semester) ?? null;
}

export const NO_ROUTINE_MESSAGE =
  "এই সেমিস্টারের রুটিন এখনো যোগ করা হয়নি / Routine for this semester is not added yet.";
