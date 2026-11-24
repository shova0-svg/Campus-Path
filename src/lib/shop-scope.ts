import { INSTITUTES } from "@/lib/campus-data";
import { parseStudent, STUDENT_KEY } from "@/lib/student";

/** Shop items are scoped to the student's institute, falling back to the app default. */
export function currentShopInstitute(): string {
  if (typeof window === "undefined") return INSTITUTES[0].id;
  const raw = window.localStorage.getItem(STUDENT_KEY);
  return parseStudent(raw)?.instituteId || INSTITUTES[0].id;
}
