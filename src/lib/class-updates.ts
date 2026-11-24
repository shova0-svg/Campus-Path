/** Pure helpers for CR class updates. All dates use Asia/Dhaka (UTC+6). */

export type UpdateType =
  "class_off" | "class_test" | "exam" | "assignment" | "teacher_notice" | "room_change" | "general";

export const UPDATE_TYPES: { id: UpdateType; label: string }[] = [
  { id: "class_off", label: "ক্লাস বাতিল / Class off" },
  { id: "class_test", label: "ক্লাস টেস্ট / CT" },
  { id: "exam", label: "পরীক্ষা / Exam" },
  { id: "assignment", label: "অ্যাসাইনমেন্ট / Assignment" },
  { id: "teacher_notice", label: "স্যারের নোটিশ / Teacher notice" },
  { id: "room_change", label: "রুম পরিবর্তন / Room change" },
  { id: "general", label: "সাধারণ / General" },
];

export interface ClassKey {
  instituteId: string;
  department: string;
  semester: number;
  shift: number;
}

export interface ClassUpdate extends ClassKey {
  id: string;
  type: UpdateType;
  subjectCode?: string | null;
  eventDate?: string | null;
  eventTime?: string | null;
  title: string;
  body?: string | null;
  urgent: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  deletedAt?: string | null;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidCrEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

/** YYYY-MM-DD in Dhaka, never the device timezone. */
export function dhakaDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function isToday(eventDate: string | null | undefined, now: Date = new Date()): boolean {
  return Boolean(eventDate) && eventDate === dhakaDate(now);
}

export function isTomorrow(eventDate: string | null | undefined, now: Date = new Date()): boolean {
  if (!eventDate) return false;
  const d = new Date(`${dhakaDate(now)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return eventDate === d.toISOString().slice(0, 10);
}

export function isActive(update: ClassUpdate, now: Date = new Date()): boolean {
  if (update.deletedAt) return false;
  if (!update.expiresAt) return true;
  return new Date(update.expiresAt).getTime() > now.getTime();
}

export function sortUpdates(updates: ClassUpdate[]): ClassUpdate[] {
  return [...updates].sort((a, b) => {
    if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export interface BannerSummary {
  urgent: boolean;
  classOff: boolean;
  label: string;
}

/** Top-of-home banner when something important is scheduled today/tomorrow. */
export function summarizeForBanner(
  updates: ClassUpdate[],
  now: Date = new Date(),
): BannerSummary | null {
  const relevant = updates.filter(
    (u) => isActive(u, now) && (isToday(u.eventDate, now) || isTomorrow(u.eventDate, now)),
  );
  if (relevant.length === 0) return null;
  const classOff = relevant.some((u) => u.type === "class_off");
  const urgent = relevant.some((u) => u.urgent);
  const first = relevant[0]!;
  return {
    urgent,
    classOff,
    label: isToday(first.eventDate, now) ? `আজ: ${first.title}` : `কাল: ${first.title}`,
  };
}

export function dateLabel(eventDate: string | null | undefined, now: Date = new Date()): string {
  if (isToday(eventDate, now)) return "আজ / Today";
  if (isTomorrow(eventDate, now)) return "কাল / Tomorrow";
  return eventDate || "—";
}

export interface UpdateInput {
  type: UpdateType | "";
  title: string;
  body: string;
  eventDate: string;
  eventTime?: string;
  subjectCode?: string;
  urgent: boolean;
}

export function validateUpdate(
  input: UpdateInput,
  now: Date = new Date(),
): {
  errors: Record<string, string>;
  warning: string;
} {
  const errors: Record<string, string> = {};
  if (!input["type"]) errors["type"] = "ধরন বেছে নিন / Choose a type";
  const title = input["title"].trim();
  if (title.length < 1 || title.length > 100)
    errors["title"] = "শিরোনাম ১–১০০ অক্ষর / 1–100 characters";
  if (input["body"].trim().length > 1000) errors["body"] = "বার্তা সর্বোচ্চ ১০০০ অক্ষর / Max 1000";
  if (!input["eventDate"]) errors["eventDate"] = "তারিখ দিন / Date required";
  let warning = "";
  if (input["eventDate"] && input["eventDate"] < dhakaDate(now))
    warning = "আগের তারিখ — নতুন তারিখ দেওয়া ভালো / Past date selected";
  return { errors, warning };
}

export function classKeyOf(key: ClassKey): string {
  return `${key.instituteId}:${key.department}:${key.semester}:${key.shift}`;
}

export function forClass(updates: ClassUpdate[], key: ClassKey): ClassUpdate[] {
  return updates.filter(
    (u) =>
      u.instituteId === key.instituteId &&
      u.department === key.department &&
      u.semester === key.semester &&
      u.shift === key.shift,
  );
}

/** Maps a Supabase error to a friendly Bangla/English message for the CR form. */
export function crErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (/duplicate|unique/i.test(message))
    return "এই ক্লাসে email-ta আগেই আছে / Already a CR for this class";
  if (/max 2/i.test(message)) return "এই ক্লাসে সর্বোচ্চ ২ জন CR / Max 2 CRs per class";
  return "CR যোগ করা যায় ni / Could not add CR";
}
