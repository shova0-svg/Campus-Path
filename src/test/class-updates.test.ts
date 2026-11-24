import { describe, expect, it } from "vitest";
import {
  crErrorMessage,
  dhakaDate,
  forClass,
  isActive,
  isToday,
  isTomorrow,
  normalizeEmail,
  sortUpdates,
  summarizeForBanner,
  validateUpdate,
  type ClassUpdate,
  type UpdateInput,
} from "@/lib/class-updates";

const base: Omit<ClassUpdate, "id" | "createdAt"> = {
  instituteId: "rpi",
  department: "Computer Science & Technology",
  semester: 3,
  shift: 1,
  type: "general",
  title: "Test update",
  urgent: false,
  createdBy: "user-1",
  updatedAt: "2026-11-23T00:00:00Z",
  expiresAt: "2026-12-01T00:00:00Z",
};

const update = (patch: Partial<ClassUpdate> = {}): ClassUpdate => ({
  ...base,
  id: patch.id ?? "u1",
  createdAt: patch.createdAt ?? "2026-11-23T00:00:00Z",
  ...patch,
});

const input = (patch: Partial<UpdateInput> = {}): UpdateInput => ({
  type: "general",
  title: "Tomorrow class",
  body: "",
  eventDate: "2026-11-24",
  urgent: false,
  ...patch,
});

describe("class update helpers", () => {
  it("normalizes email", () => {
    expect(normalizeEmail("  CR@Example.COM ")).toBe("cr@example.com");
  });

  it("uses Dhaka dates regardless of device timezone", () => {
    // 2026-11-23 17:30 UTC = 2026-11-23 23:30 Dhaka; 18:30 UTC = 24th in Dhaka.
    expect(dhakaDate(new Date("2026-11-23T17:30:00Z"))).toBe("2026-11-23");
    expect(dhakaDate(new Date("2026-11-23T18:30:00Z"))).toBe("2026-11-24");
    expect(isToday("2026-11-24", new Date("2026-11-23T18:30:00Z"))).toBe(true);
    expect(isTomorrow("2026-11-25", new Date("2026-11-23T18:30:00Z"))).toBe(true);
    expect(isTomorrow("2026-11-24", new Date("2026-11-23T18:30:00Z"))).toBe(false);
  });

  it("hides expired and soft-deleted updates", () => {
    const now = new Date("2026-11-24T00:00:00Z");
    expect(isActive(update(), now)).toBe(true);
    expect(isActive(update({ expiresAt: "2026-11-23T23:00:00Z" }), now)).toBe(false);
    expect(isActive(update({ deletedAt: "2026-11-23T23:00:00Z" }), now)).toBe(false);
  });

  it("sorts urgent first then newest", () => {
    const list = [
      update({ id: "old", createdAt: "2026-11-20T00:00:00Z" }),
      update({ id: "urgent", createdAt: "2026-11-21T00:00:00Z", urgent: true }),
      update({ id: "new", createdAt: "2026-11-23T00:00:00Z" }),
    ];
    expect(sortUpdates(list).map((u) => u.id)).toEqual(["urgent", "new", "old"]);
  });

  it("builds a banner only for today/tomorrow updates", () => {
    const now = new Date("2026-11-23T18:30:00Z"); // Dhaka 24th
    expect(
      summarizeForBanner([update({ eventDate: "2026-11-24", title: "CT tomorrow" })], now),
    ).toMatchObject({
      urgent: false,
      label: "আজ: CT tomorrow",
    });
    expect(
      summarizeForBanner(
        [update({ type: "class_off", urgent: true, eventDate: "2026-11-25" })],
        now,
      ),
    ).toMatchObject({
      classOff: true,
      urgent: true,
    });
    expect(summarizeForBanner([update({ eventDate: "2026-11-30" })], now)).toBeNull();
  });
});

describe("class scoping and CR errors", () => {
  it("shows only the matching class's updates", () => {
    const key = {
      instituteId: "rpi",
      department: "Computer Science & Technology",
      semester: 3,
      shift: 1,
    };
    const list = [
      update({ id: "mine" }),
      update({ id: "other-sem", semester: 1 }),
      update({ id: "other-shift", shift: 2 }),
    ];
    expect(forClass(list, key).map((u) => u.id)).toEqual(["mine"]);
  });

  it("maps duplicate and max-2 errors", () => {
    expect(crErrorMessage(new Error("duplicate key value"))).toContain("Already a CR");
    expect(crErrorMessage(new Error("Max 2 CRs per class allowed"))).toContain("Max 2");
  });
});

describe("update form validation", () => {
  it("accepts a short valid post", () => {
    expect(validateUpdate(input(), new Date("2026-11-23T00:00:00Z")).errors).toEqual({});
  });

  it("requires type/date and caps lengths", () => {
    const { errors } = validateUpdate(
      input({ type: "", eventDate: "", title: "x".repeat(101), body: "y".repeat(1001) }),
      new Date("2026-11-23T00:00:00Z"),
    );
    expect(Object.keys(errors).sort()).toEqual(["body", "eventDate", "title", "type"]);
  });

  it("warns about a past date", () => {
    const { warning } = validateUpdate(
      input({ eventDate: "2026-11-20" }),
      new Date("2026-11-23T00:00:00Z"),
    );
    expect(warning).toContain("Past date");
  });
});
