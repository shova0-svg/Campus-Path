import { createResource, type Resource } from "@/lib/cache";
import { classKeyOf, type ClassKey, type ClassUpdate, type UpdateType } from "@/lib/class-updates";
import { db } from "./client";

type Row = {
  id: string;
  institute_id: string;
  department: string;
  semester: number;
  shift: number;
  type: string;
  subject_code: string | null;
  event_date: string | null;
  event_time: string | null;
  title: string;
  body: string | null;
  urgent: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
  deleted_at: string | null;
};

function fromRow(row: Row): ClassUpdate {
  return {
    id: row.id,
    instituteId: row.institute_id,
    department: row.department,
    semester: row.semester,
    shift: row.shift,
    type: row["type"] as UpdateType,
    ...(row["subject_code"] ? { subjectCode: row["subject_code"] } : {}),
    ...(row["event_date"] ? { eventDate: row["event_date"] } : {}),
    ...(row["event_time"] ? { eventTime: row["event_time"].slice(0, 5) } : {}),
    title: row["title"],
    ...(row["body"] ? { body: row["body"] } : {}),
    urgent: row["urgent"],
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    expiresAt: row.expires_at,
    ...(row.deleted_at ? { deletedAt: row.deleted_at } : {}),
  };
}

export function isMissingTableError(error: unknown): boolean {
  const code = (error as { code?: string })?.code;
  return code === "PGRST205" || code === "42P01" || code === "404";
}

export async function listForClass(key: ClassKey): Promise<ClassUpdate[]> {
  const { data, error } = await db
    .from("class_updates")
    .select("*")
    .eq("institute_id", key.instituteId)
    .eq("department", key.department)
    .eq("semester", key.semester)
    .eq("shift", key.shift)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []).map((r) => fromRow(r as Row));
}

const resources = new Map<string, Resource<ClassUpdate[]>>();

/** Offline-first resource; missing table never crashes the app. */
export function classUpdatesResource(key: ClassKey): Resource<ClassUpdate[]> {
  const cacheKey = `class-updates-v1:${classKeyOf(key)}`;
  let resource = resources.get(cacheKey);
  if (!resource) {
    resource = createResource<ClassUpdate[]>({
      key: cacheKey,
      seed: () => [],
      fetcher: async () => {
        try {
          return await listForClass(key);
        } catch {
          return null; // keep last-known cache; tables may not exist yet
        }
      },
    });
    resources.set(cacheKey, resource);
  }
  return resource;
}

export type CreateUpdateInput = {
  instituteId: string;
  department: string;
  semester: number;
  shift: number;
  type: UpdateType;
  subjectCode?: string;
  eventDate?: string;
  eventTime?: string;
  title: string;
  body?: string;
  urgent?: boolean;
};

export async function createUpdate(input: CreateUpdateInput): Promise<ClassUpdate> {
  const { data, error } = await db
    .from("class_updates")
    .insert({
      institute_id: input.instituteId,
      department: input.department,
      semester: input.semester,
      shift: input.shift,
      type: input.type,
      ...(input.subjectCode ? { subject_code: input.subjectCode } : {}),
      ...(input.eventDate ? { event_date: input.eventDate } : {}),
      ...(input.eventTime ? { event_time: input.eventTime } : {}),
      title: input.title.trim(),
      ...(input.body ? { body: input.body.trim() } : {}),
      urgent: input.urgent ?? false,
    })
    .select("*")
    .single();
  if (error) throw error;
  return fromRow(data as Row);
}

export async function updateUpdate(
  id: string,
  patch: {
    type?: UpdateType;
    subjectCode?: string;
    eventDate?: string;
    eventTime?: string;
    title?: string;
    body?: string;
    urgent?: boolean;
  },
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch["type"]) row["type"] = patch["type"];
  if (patch["subjectCode"] !== undefined) row["subject_code"] = patch["subjectCode"] || null;
  if (patch["eventDate"] !== undefined) row["event_date"] = patch["eventDate"] || null;
  if (patch["eventTime"] !== undefined) row["event_time"] = patch["eventTime"] || null;
  if (patch["title"] !== undefined) row["title"] = patch["title"].trim();
  if (patch["body"] !== undefined) row["body"] = patch["body"].trim();
  if (patch["urgent"] !== undefined) row["urgent"] = patch["urgent"];
  const { error } = await db.from("class_updates").update(row).eq("id", id);
  if (error) throw error;
}

export async function softDeleteUpdate(id: string): Promise<void> {
  const { error } = await db
    .from("class_updates")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
