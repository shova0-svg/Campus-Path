import { db } from "./client";
import type { FeedbackDraft } from "@/lib/feedback";
import type { UsageEvent } from "@/lib/stats";

export interface FeedbackRow extends FeedbackDraft {
  id: string;
  user_id: string | null;
  institute_id: string;
  created_at: string;
}

export async function submitFeedback(
  userId: string | null,
  instituteId: string,
  draft: FeedbackDraft,
): Promise<void> {
  const { error } = await db.from("feedback").insert({
    user_id: userId,
    institute_id: instituteId,
    rating: draft.rating,
    category: draft.category,
    message: draft.message.trim(),
    page: draft.page,
  });
  if (error) throw error;
}

export async function listFeedback(instituteId: string): Promise<FeedbackRow[]> {
  const { data, error } = await db
    .from("feedback")
    .select("*")
    .eq("institute_id", instituteId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as FeedbackRow[];
}

export async function listUsageEvents(instituteId: string, days = 30): Promise<UsageEvent[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await db
    .from("usage_events")
    .select("user_id, institute_id, event, meta, created_at")
    .eq("institute_id", instituteId)
    .gte("created_at", since);
  if (error) throw error;
  return (data ?? []) as UsageEvent[];
}
