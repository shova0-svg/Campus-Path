import { normalizeEmail } from "@/lib/class-updates";
import type { ClassKey } from "@/lib/class-updates";
import { db } from "./client";

export interface CrRow extends ClassKey {
  id: string;
  email: string;
  createdAt: string;
}

type Row = {
  id: string;
  email: string;
  institute_id: string;
  department: string;
  semester: number;
  shift: number;
  created_at: string;
};

function fromRow(row: Row): CrRow {
  return {
    id: row.id,
    email: row.email,
    instituteId: row.institute_id,
    department: row.department,
    semester: row.semester,
    shift: row.shift,
    createdAt: row.created_at,
  };
}

export async function listCrs(instituteId?: string): Promise<CrRow[]> {
  let query = db.from("class_representatives").select("*");
  if (instituteId) query = query.eq("institute_id", instituteId);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => fromRow(r as Row));
}

export async function addCr(input: ClassKey & { email: string }): Promise<void> {
  const { error } = await db.from("class_representatives").insert({
    email: normalizeEmail(input.email),
    institute_id: input.instituteId,
    department: input.department,
    semester: input.semester,
    shift: input.shift,
  });
  if (error) throw error;
}

export async function removeCr(id: string): Promise<void> {
  const { error } = await db.from("class_representatives").delete().eq("id", id);
  if (error) throw error;
}

export async function myCrAssignments(): Promise<CrRow[]> {
  const { data, error } = await db.rpc("my_cr_assignments");
  if (error) throw error;
  // The RPC returns snake_case columns; map them to the client model.
  return (data ?? []).map((row: Row) => fromRow(row));
}
