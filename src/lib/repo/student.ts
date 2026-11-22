import type { StudentProfile } from "@/lib/student";
import { db } from "./client";

type Row = {
  user_id: string;
  institute_id: string;
  department: string;
  semester: number;
  group: string;
  shift: string;
  reminder_enabled: boolean;
};

export function fromRow(row: Row, email = ""): StudentProfile & { reminderEnabled: boolean } {
  return {
    email,
    name: "",
    instituteId: row.institute_id,
    department: row.department,
    semester: row.semester,
    group: row.group,
    shift: row.shift,
    reminderEnabled: row.reminder_enabled,
  };
}

export async function loadStudentProfile(userId: string): Promise<StudentProfile | null> {
  const { data, error } = await db
    .from("student_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return fromRow(data as Row) as StudentProfile;
}

export async function saveStudentProfile(
  userId: string,
  profile: StudentProfile,
  reminderEnabled = false,
): Promise<void> {
  const { error } = await db.from("student_profiles").upsert({
    user_id: userId,
    institute_id: profile.instituteId,
    department: profile.department,
    semester: profile.semester,
    group: profile.group,
    shift: profile.shift,
    reminder_enabled: reminderEnabled,
  });
  if (error) throw error;
}
