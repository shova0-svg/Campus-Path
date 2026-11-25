/** Pure helpers for offline Campus Shop purchase requests. */

export type RequestStatus = "pending" | "accepted" | "rejected" | "cancelled" | "completed";
export type RequestActor = "buyer" | "seller" | "admin";

export const REQUEST_STATUSES: { id: RequestStatus; label: string }[] = [
  { id: "pending", label: "Pending / অপেক্ষমাণ" },
  { id: "accepted", label: "Accepted / গৃহীত" },
  { id: "rejected", label: "Rejected / প্রত্যাখ্যাত" },
  { id: "cancelled", label: "Cancelled / বাতিল" },
  { id: "completed", label: "Completed / সম্পন্ন" },
];

export const REQUEST_SAFETY_NOTE =
  "Meet on campus, check the item before paying, pay in person. / ক্যাম্পাসে দেখা করুন, আগে জিনিস দেখে তারপর টাকা দিন।";

export function requestStatusLabel(status: RequestStatus): string {
  return REQUEST_STATUSES.find((s) => s.id === status)?.label ?? status;
}

/** Mirrors the DB trigger's allowed transitions. */
export function allowedTransition(
  from: RequestStatus,
  to: RequestStatus,
  actor: RequestActor,
): boolean {
  if (from === to) return false;
  if (actor === "admin") return true;
  if (actor === "buyer") return from === "pending" && to === "cancelled";
  return (
    (from === "pending" && (to === "accepted" || to === "rejected")) ||
    (from === "accepted" && to === "completed")
  );
}

export function validateRequestInput(
  quantity: number,
  available: number,
  message: string,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20)
    errors["quantity"] = "১–২০ সংখ্যা দিন / Quantity 1–20";
  if (quantity > available) errors["quantity"] = "পর্যাপ্ত স্টক নেই / Not enough stock";
  if (message.trim().length > 500) errors["message"] = "সর্বোচ্চ ৫০০ অক্ষর / Max 500 characters";
  return errors;
}
