import type { AdminAccount } from "@/lib/admin";
import { db } from "./client";

type Row = {
  id: string;
  user_id: string;
  email: string | null;
  institute_id: string | null;
  role: "super_admin" | "institute_admin";
  created_at: string;
};

export function fromRow(row: Row): AdminAccount {
  return {
    email: row.email ?? "",
    instituteId: row.institute_id ?? "all",
    role: row.role === "super_admin" ? "super" : "institute",
    addedBy: row.user_id,
    addedAt: row.created_at,
  };
}

export async function listAdmins(): Promise<AdminAccount[]> {
  // Only the user's own row + super admin rows are visible via RLS.
  const { data, error } = await db
    .from("institute_admins")
    .select("id, user_id, email, institute_id, role, created_at");
  if (error) throw error;
  return (data ?? []).map((r) => fromRow(r as Row));
}

export async function addAdminByEmail(email: string, instituteId: string): Promise<void> {
  // Resolve email -> user id via a SECURITY DEFINER function would be needed for
  // non-super users; super admins can call the RPC below. Fallback: no-op.
  const { error } = await db.rpc("add_institute_admin_by_email", {
    p_email: email.trim().toLowerCase(),
    p_institute_id: instituteId === "all" ? null : instituteId,
  });
  if (error) throw error;
}

export async function removeAdminRow(userId: string): Promise<void> {
  const { error } = await db.from("institute_admins").delete().eq("user_id", userId);
  if (error) throw error;
}
