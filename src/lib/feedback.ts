/** Pure feedback form logic — shared by the dialog and unit tests. */

export const FEEDBACK_CATEGORIES = [
  { id: "bug", label: "Bug / সমস্যা" },
  { id: "missing_room", label: "Missing room / রুম নেই" },
  { id: "wrong_routine", label: "Wrong routine / ভুল রুটিন" },
  { id: "idea", label: "Idea / আইডিয়া" },
] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number]["id"];

export interface FeedbackDraft {
  rating: number;
  category: FeedbackCategory | "";
  message: string;
  page: string;
}

export const emptyFeedback = (page = ""): FeedbackDraft => ({
  rating: 0,
  category: "",
  message: "",
  page,
});

/** Returns a map of field → error message. Empty map means valid. */
export function validateFeedback(
  draft: FeedbackDraft,
): Partial<Record<"rating" | "category" | "message", string>> {
  const errors: Partial<Record<"rating" | "category" | "message", string>> = {};
  if (!Number.isInteger(draft.rating) || draft.rating < 1 || draft.rating > 5)
    errors.rating = "Rating 1–5 দিন / Pick a rating";
  if (!draft.category || !FEEDBACK_CATEGORIES.some((c) => c.id === draft.category))
    errors.category = "Category বেছে নিন / Pick a category";
  if (draft.message.trim().length > 1000)
    errors.message = "Message 1000 অক্ষরের কম / Max 1000 characters";
  return errors;
}

export function categoryLabel(id: string): string {
  return FEEDBACK_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export const FEEDBACK_EVENT = "sohoj:feedback";

export interface FeedbackRequest {
  category?: FeedbackCategory;
  message?: string;
  page?: string;
  instituteId?: string;
}

/** Open the global feedback dialog from anywhere (cards, error boundary, pages). */
export function openFeedback(detail: FeedbackRequest = {}): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<FeedbackRequest>(FEEDBACK_EVENT, { detail }));
}
