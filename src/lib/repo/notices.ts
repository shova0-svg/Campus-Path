import type { Notice, NoticeSource } from "@/lib/notices";
import { db } from "./client";

export interface StoredNotice extends Notice {
  sourceUrl: string;
  status: "pending" | "approved" | "rejected";
  pushedAt?: string;
  updatedAt: string;
}

type NoticeRow = {
  id: string;
  institute_id: string;
  title: string;
  url: string;
  published_date: string;
  image: string | null;
  source_url: string;
  source: string;
  status: string;
  created_at: string;
  updated_at: string;
  pushed_at?: string | null;
};

type SourceRow = {
  institute_id: string;
  label: string;
  url: string;
  active: boolean;
};

function fromRow(row: NoticeRow): StoredNotice {
  return {
    id: row.id,
    instituteId: row.institute_id,
    title: row.title,
    date: row.published_date,
    url: row.url,
    ...(row.image ? { image: row.image } : {}),
    source: row.source === "manual" ? "manual" : "fetched",
    sourceUrl: row.source_url,
    status: row.status as StoredNotice["status"],
    ...(row.pushed_at ? { pushedAt: row.pushed_at } : {}),
    fetchedAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listApprovedNotices(instituteId: string): Promise<Notice[]> {
  const { data, error } = await db
    .from("notices")
    .select("*")
    .eq("institute_id", instituteId)
    .eq("status", "approved")
    .order("published_date", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []).map((r) => fromRow(r as NoticeRow));
}

export async function listAllNotices(instituteId: string): Promise<StoredNotice[]> {
  const { data, error } = await db
    .from("notices")
    .select("*")
    .eq("institute_id", instituteId)
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw error;
  return (data ?? []).map((r) => fromRow(r as NoticeRow));
}

export async function addNoticesRemote(notices: Notice[]): Promise<number> {
  if (notices.length === 0) return 0;
  const rows = notices.map((n) => ({
    id: `${n.instituteId}:${n.id}`,
    institute_id: n.instituteId,
    title: n.title,
    url: n.url,
    published_date: n.date,
    ...(n.image ? { image: n.image } : {}),
    source_url: n.url,
    source: n.source,
    status: "pending",
  }));
  const { error } = await db
    .from("notices")
    .upsert(rows, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw error;
  return rows.length;
}

export async function setNoticeStatus(id: string, status: "approved" | "rejected"): Promise<void> {
  const { error } = await db.from("notices").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function updateNotice(
  id: string,
  patch: { title?: string; url?: string; published_date?: string },
): Promise<void> {
  const { error } = await db.from("notices").update(patch).eq("id", id);
  if (error) throw error;
}

export async function removeNotice(id: string): Promise<void> {
  const { error } = await db.from("notices").delete().eq("id", id);
  if (error) throw error;
}

export async function listNoticeSources(): Promise<NoticeSource[]> {
  const { data, error } = await db.from("notice_sources").select("*").eq("active", true);
  if (error) throw error;
  return (data ?? []).map((r) => {
    const row = r as SourceRow;
    return { instituteId: row.institute_id, label: row.label, url: row.url };
  });
}

export async function saveNoticeSource(source: NoticeSource): Promise<void> {
  const { error } = await db.from("notice_sources").upsert({
    institute_id: source.instituteId,
    label: source.label,
    url: source.url,
    active: true,
  });
  if (error) throw error;
}

export async function removeNoticeSource(instituteId: string): Promise<void> {
  const { error } = await db.from("notice_sources").delete().eq("institute_id", instituteId);
  if (error) throw error;
}
