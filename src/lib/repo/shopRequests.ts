import { supabase } from "@/integrations/supabase/client";
import { db } from "./client";
import type { RequestStatus } from "@/lib/shop-requests";

export interface PurchaseRequest {
  id: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  quantity: number;
  message: string;
  status: RequestStatus;
  meetingNote: string;
  createdAt: string;
  updatedAt: string;
}

type Row = {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  quantity: number;
  message: string;
  status: string;
  meeting_note: string;
  created_at: string;
  updated_at: string;
};

function fromRow(row: Row): PurchaseRequest {
  return {
    id: row.id,
    productId: row.product_id,
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    quantity: row.quantity,
    message: row.message,
    status: row.status as RequestStatus,
    meetingNote: row.meeting_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  createdAt: string;
  readAt?: string;
}

export async function createRequest(input: {
  productId: string;
  quantity: number;
  message: string;
}): Promise<void> {
  const { error } = await db.from("purchase_requests").insert({
    product_id: input.productId,
    quantity: input.quantity,
    message: input.message.trim(),
  });
  if (error) throw error;
}

async function listRequests(column: "buyer_id" | "seller_id"): Promise<PurchaseRequest[]> {
  try {
    const { data, error } = await db
      .from("purchase_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    // RLS already scopes rows; filter locally by the supplied column for clarity.
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    return (data ?? []).filter((r) => (r as Row)[column] === uid).map((r) => fromRow(r as Row));
  } catch {
    return [];
  }
}

export const listMyRequests = () => listRequests("buyer_id");
export const listIncomingRequests = () => listRequests("seller_id");

export async function updateRequest(
  id: string,
  patch: { status?: RequestStatus; meetingNote?: string },
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.status) row["status"] = patch.status;
  if (patch.meetingNote !== undefined) row["meeting_note"] = patch.meetingNote.trim();
  const { error } = await db.from("purchase_requests").update(row).eq("id", id);
  if (error) throw error;
}

export async function listNotifications(unreadOnly = false): Promise<NotificationItem[]> {
  try {
    let query = db
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (unreadOnly) query = query.is("read_at", null);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: String(r.id),
      userId: String(r.user_id),
      type: String(r.type),
      title: String(r.title),
      body: String(r.body ?? ""),
      createdAt: String(r.created_at),
      ...(r.read_at ? { readAt: String(r.read_at) } : {}),
    }));
  } catch {
    return [];
  }
}

export async function unreadNotificationCount(): Promise<number> {
  return (await listNotifications(true)).length;
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await db
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
