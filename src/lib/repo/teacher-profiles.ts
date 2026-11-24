import { supabase } from "@/integrations/supabase/client";
import { db } from "./client";

export interface TeacherProfileRow {
  userId: string;
  instituteId: string;
  teacherName: string;
  directoryId: string | null;
  reminderEnabled: boolean;
}

type Row = {
  user_id: string;
  institute_id: string;
  teacher_name: string;
  directory_id: string | null;
  reminder_enabled: boolean;
};

export async function listTeacherProfiles(instituteId: string): Promise<TeacherProfileRow[]> {
  const { data, error } = await db
    .from("teacher_profiles")
    .select("*")
    .eq("institute_id", instituteId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => {
    const row = r as Row;
    return {
      userId: row.user_id,
      instituteId: row.institute_id,
      teacherName: row.teacher_name,
      directoryId: row.directory_id,
      reminderEnabled: row.reminder_enabled,
    };
  });
}

export async function setTeacherReminder(userId: string, enabled: boolean): Promise<void> {
  const { error } = await db
    .from("teacher_profiles")
    .update({ reminder_enabled: enabled })
    .eq("user_id", userId);
  if (error) throw error;
}

export async function createTeacherAccount(input: {
  email: string;
  teacherName: string;
  instituteId: string;
  directoryId?: string;
}): Promise<{ password: string }> {
  const { data, error } = await supabase.functions.invoke("create-teacher-account", {
    body: input,
  });
  if (error) throw error;
  const result = data as { error?: string; password?: string };
  if (result?.error || !result?.password)
    throw new Error(result?.error ?? "Could not create account");
  return { password: result.password };
}
