import { describe, expect, it } from "vitest";
import {
  emptyFeedback,
  FEEDBACK_CATEGORIES,
  validateFeedback,
  type FeedbackDraft,
} from "@/lib/feedback";
import { aggregateUsage, dayKey, type UsageEvent } from "@/lib/stats";

describe("feedback form validation", () => {
  const good: FeedbackDraft = {
    rating: 4,
    category: "missing_room",
    message: "Room 1305 is missing",
    page: "home",
  };

  it("accepts a valid 20-second submission", () => {
    expect(validateFeedback(good)).toEqual({});
  });

  it("rejects ratings outside 1–5", () => {
    expect(validateFeedback({ ...good, rating: 0 }).rating).toBeDefined();
    expect(validateFeedback({ ...good, rating: 6 }).rating).toBeDefined();
    expect(validateFeedback({ ...good, rating: 2.5 }).rating).toBeDefined();
  });

  it("requires a known category", () => {
    expect(validateFeedback({ ...good, category: "" }).category).toBeDefined();
    expect(validateFeedback({ ...good, category: "spam" as never }).category).toBeDefined();
    for (const c of FEEDBACK_CATEGORIES) {
      expect(validateFeedback({ ...good, category: c.id })).toEqual({});
    }
  });

  it("caps the message length but allows an empty one", () => {
    expect(validateFeedback({ ...good, message: "" })).toEqual({});
    expect(validateFeedback({ ...good, message: "x".repeat(1001) }).message).toBeDefined();
  });

  it("starts empty", () => {
    expect(validateFeedback(emptyFeedback("student")).rating).toBeDefined();
  });
});

const NOW = new Date("2026-11-22T12:00:00Z"); // Sunday 18:00 Dhaka
const ev = (
  user_id: string | null,
  event: string,
  created_at: string,
  meta: Record<string, unknown> = {},
): UsageEvent => ({ user_id, event, created_at, meta, institute_id: "rpi" });

const EVENTS: UsageEvent[] = [
  ev("u1", "app_open", "2026-11-22T02:00:00Z"),
  ev("u1", "search", "2026-11-22T02:10:00Z", { room: "1305" }),
  ev("u1", "search", "2026-11-22T02:20:00Z", { room: "1305" }),
  ev("u2", "qr_scan", "2026-11-22T03:00:00Z"),
  ev("u2", "reminder_enabled", "2026-11-22T03:30:00Z"),
  ev("u3", "search", "2026-11-21T02:00:00Z", { room: "2106" }),
  ev("u5", "app_open", "2026-11-01T02:00:00Z"), // inside 30d, outside 7d
  ev("u4", "app_open", "2026-10-01T02:00:00Z"), // outside both
];

describe("usage stats aggregation", () => {
  it("uses Asia/Dhaka day keys", () => {
    expect(dayKey("2026-11-22T18:30:00Z")).toBe("2026-11-23");
    expect(dayKey("2026-11-22T02:00:00Z")).toBe("2026-11-22");
  });

  it("counts distinct daily active users and deduplicates searches by room", () => {
    const stats = aggregateUsage(EVENTS, 7, NOW);
    expect(stats.totalEvents).toBe(6);
    expect(stats.activeUsers).toBe(3);
    expect(stats.dailyActiveUsers).toEqual([
      { day: "2026-11-21", count: 1 },
      { day: "2026-11-22", count: 2 },
    ]);
    expect(stats.topRooms).toEqual([
      { room: "1305", count: 2 },
      { room: "2106", count: 1 },
    ]);
  });

  it("counts QR scans and reminder opt-ins once per user", () => {
    const stats = aggregateUsage(EVENTS, 7, NOW);
    expect(stats.qrScans).toBe(1);
    expect(stats.reminderOptIns).toBe(1);
    expect(stats.byEvent).toMatchObject({
      search: 3,
      app_open: 1,
      qr_scan: 1,
      reminder_enabled: 1,
    });
  });

  it("respects the 7 / 30 day window", () => {
    expect(aggregateUsage(EVENTS, 7, NOW).activeUsers).toBe(3);
    const month = aggregateUsage(EVENTS, 30, NOW);
    expect(month.activeUsers).toBe(4);
    expect(month.byEvent["app_open"]).toBe(2);
  });

  it("handles empty data", () => {
    const stats = aggregateUsage([], 7, NOW);
    expect(stats.activeUsers).toBe(0);
    expect(stats.topRooms).toEqual([]);
    expect(stats.dailyActiveUsers).toEqual([]);
  });
});
