import type { Teacher } from "@/lib/teachers";
import { db } from "./client";

type Row = {
  id: string;
  institute_id: string;
  department: string;
  name: string;
  designation: string;
  phone: string;
  email: string;
  photo_url: string;
  room_no: string;
  data: Record<string, unknown> | null;
};

export function fromRow(row: Row): Teacher {
  return {
    ...(row.data as unknown as Teacher),
    id: row.id,
    instituteId: row.institute_id,
    name: row.name,
    designation: row.designation,
    faculty: row.department,
    department: row.department,
    mobile: row.phone,
    email: row.email,
    photo: row.photo_url,
    room: row.room_no,
  };
}

export async function listTeachers(): Promise<Teacher[]> {
  const { data, error } = await db.from("teachers").select("*");
  if (error) throw error;
  return (data ?? []).map((r) => fromRow(r as Row));
}

export async function upsertTeacherRow(teacher: Teacher): Promise<Teacher> {
  const { instituteId, ...data } = teacher;
  const { data: row, error } = await db
    .from("teachers")
    .upsert({
      id: teacher.id,
      institute_id: instituteId ?? "rpi",
      department: teacher.department,
      name: teacher.name,
      designation: teacher.designation,
      phone: teacher.mobile,
      email: teacher.email,
      photo_url: teacher.photo,
      room_no: teacher.room,
      data,
    })
    .select()
    .single();
  if (error) throw error;
  return fromRow(row as Row);
}

export async function removeTeacherRow(id: string): Promise<void> {
  const { error } = await db.from("teachers").delete().eq("id", id);
  if (error) throw error;
}
