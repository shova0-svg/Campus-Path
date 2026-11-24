import type { AdminAccount } from "@/lib/admin";
import { db } from "./client";

type Row = {
  id: string;
  user_id: string;
  email: string | null;
  institute_id: string | null;
  role: "super_admin" | "sub_admin" | "institute_admin";
  created_at: string;
  assigned_by?: string | null;
  assigned_at?: string | null;
};

export function fromRow(row: Row): AdminAccount {
  return {
    email: row.email ?? "",
    instituteId: row.institute_id ?? "all",
    role: row.role === "super_admin" ? "super" : "institute",
    addedBy: row.user_id,
    addedAt: row.assigned_at ?? row.created_at,
  };
}

/** Rich assignment row from the super-admin RPC (includes display name). */
export interface AdminAssignment {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  instituteId: string;
  role: "super" | "sub";
  assignedBy: string | null;
  assignedAt: string;
}

type AssignmentRow = {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  institute_id: string | null;
  role: string;
  assigned_by: string | null;
  assigned_at: string | null;
  created_at?: string;
};

function fromAssignment(row: AssignmentRow): AdminAssignment {
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email ?? "",
    displayName: row.display_name ?? "",
    instituteId: row.institute_id ?? "all",
    role: row.role === "super_admin" ? "super" : "sub",
    assignedBy: row.assigned_by ?? null,
    assignedAt: row.assigned_at ?? row.created_at ?? "",
  };
}

export async function listAdmins(): Promise<AdminAccount[]> {
  // Super admins see every row; a sub admin sees only their own via RLS.
  const { data, error } = await db
    .from("institute_admins")
    .select("id, user_id, email, institute_id, role, created_at, assigned_by, assigned_at");
  if (error) throw error;
  return (data ?? []).map((r) => fromRow(r as Row));
}

export async function listAdminAssignments(): Promise<AdminAssignment[]> {
  const { data, error } = await db.rpc("list_admin_assignments");
  if (error) throw error;
  return (data ?? []).map((r: AssignmentRow) => fromAssignment(r));
}

export async function myAdminRole(): Promise<AdminAssignment | null> {
  const { data, error } = await db.rpc("my_admin_role");
  if (error) throw error;
  const row = (data ?? [])[0] as AssignmentRow | undefined;
  return row ? fromAssignment(row) : null;
}

export async function addSubAdmin(email: string, instituteId: string): Promise<void> {
  const { error } = await db.rpc("add_sub_admin", {
    p_email: email.trim().toLowerCase(),
    p_institute_id: instituteId,
  });
  if (error) throw error;
}

export async function removeSubAdmin(userId: string): Promise<void> {
  const { error } = await db.rpc("remove_sub_admin", { p_user_id: userId });
  if (error) throw error;
}

/** Legacy path now respects the same DB-side rules. */
export async function addAdminByEmail(email: string, instituteId: string): Promise<void> {
  await addSubAdmin(email, instituteId);
}

export async function removeAdminRow(userId: string): Promise<void> {
  await removeSubAdmin(userId);
}

export interface AdminAuditEntry {
  id: string;
  actorId: string | null;
  action: string;
  targetId: string | null;
  instituteId: string | null;
  createdAt: string;
}

export async function listAdminAudit(instituteId?: string): Promise<AdminAuditEntry[]> {
  try {
    let query = db
      .from("admin_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (instituteId) query = query.eq("institute_id", instituteId);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: String(r.id),
      actorId: r.actor_id ? String(r.actor_id) : null,
      action: String(r.action),
      targetId: r.target_id ? String(r.target_id) : null,
      instituteId: r.institute_id ? String(r.institute_id) : null,
      createdAt: String(r.created_at),
    }));
  } catch {
    return [];
  }
}
