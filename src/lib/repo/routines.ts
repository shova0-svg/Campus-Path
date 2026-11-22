import type { ClassRoutine } from "@/lib/routine";
import { db } from "./client";

type Row = {
  id: string;
  institute_id: string;
  department: string;
  semester: number;
  group: string;
  shift: string;
  data: Record<string, unknown> | null;
};

export async function listRoutines(): Promise<ClassRoutine[]> {
  const { data, error } = await db.from("routines").select("*");
  if (error) throw error;
  return (data ?? []).map((r) => {
    const row = r as Row;
    return {
      ...(row.data as unknown as ClassRoutine),
      id: row.id,
      instituteId: row.institute_id,
      department: row.department,
      semester: row.semester,
      group: row.group,
      shift: row.shift,
    } as ClassRoutine;
  });
}

export async function upsertRoutineRow(routine: ClassRoutine): Promise<ClassRoutine> {
  const { instituteId, ...data } = routine;
  const { data: row, error } = await db
    .from("routines")
    .upsert({
      id: routine.id,
      institute_id: instituteId,
      department: routine.department,
      semester: routine.semester,
      group: routine.group ?? "",
      shift: routine.shift,
      data,
    })
    .select()
    .single();
  if (error) throw error;
  return {
    ...routine,
    instituteId: (row as Row).institute_id,
  };
}

export async function removeRoutineRow(id: string): Promise<void> {
  const { error } = await db.from("routines").delete().eq("id", id);
  if (error) throw error;
}
