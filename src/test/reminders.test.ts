import { describe, expect, it } from "vitest";
import {
  dueReminders,
  findRoutine,
  type ReminderProfile,
  type ReminderRoutine,
} from "@/lib/reminders";

const profile: ReminderProfile = {
  semester: 3,
  group: "A",
  shift: "Morning",
  department: "Computer Science & Technology",
};

const routine: ReminderRoutine = {
  semester: 3,
  shift: "Morning",
  department: "Computer Science & Technology",
  group: "A",
  title: "CST 3rd · Group A",
  periods: [
    { id: 1, time: "8:00-8:45" },
    { id: 2, time: "8:45-9:30" },
    { id: 3, time: "9:30-10:15" },
    { id: 4, time: "10:15-11:00" },
  ],
  entries: [
    {
      day: "Sunday",
      period: 1,
      endPeriod: 1,
      code: "28533",
      subject: "IT Support",
      teacher: "SORIAT",
      room: "1305",
    },
    {
      day: "Sunday",
      period: 3,
      endPeriod: 4,
      code: "25922",
      subject: "Physics-II",
      teacher: "KABIR",
      room: "2303",
    },
  ],
};

// Dhaka is UTC+6: 10:57 Dhaka = 04:57 UTC.
const at = (h: number, m: number, date = "2026-11-22") =>
  new Date(`${date}T${String(h - 6).padStart(2, "0")}:${String(m).padStart(2, "0")}:00Z`);

describe("class reminder computation", () => {
  it("warns 5 minutes before a class ends", () => {
    const due = dueReminders(profile, routine, at(10, 57));
    expect(due.some((r) => r.kind === "class_ends_soon" && r.classKey.includes("25922"))).toBe(
      true,
    );
  });

  it("warns when it is time to leave for the next class (walking time)", () => {
    // Room 2303 → 90m / 12 ≈ 8 min walk; next class starts 09:30 → leave ~09:22.
    const due = dueReminders(profile, routine, at(9, 22));
    expect(due.some((r) => r.kind === "leave_now" && /walk 8 min/i.test(r.body))).toBe(true);
  });

  it("skips leave-now after the last class of the day", () => {
    const oneClass: ReminderRoutine = { ...routine, entries: [routine.entries[1]!] };
    const due = dueReminders(profile, oneClass, at(9, 22));
    expect(due.some((r) => r.kind === "leave_now")).toBe(false);
  });

  it("returns nothing for Fri/Sat weekend and for no routine", () => {
    const friday = "2026-11-27";
    expect(dueReminders(profile, routine, at(10, 57, friday))).toHaveLength(0);
    expect(dueReminders(profile, null, at(10, 57))).toHaveLength(0);
  });

  it("returns nothing when the routine does not match the student", () => {
    const other: ReminderRoutine = { ...routine, department: "Mechanical Technology" };
    expect(dueReminders(profile, other, at(10, 57))).toHaveLength(0);
  });

  it("picks the group-specific routine", () => {
    const b: ReminderRoutine = { ...routine, group: "B", title: "CST 3rd · Group B" };
    expect(findRoutine(profile, [b, routine])?.title).toBe("CST 3rd · Group A");
  });

  it("deduplicates reminders for the same class", () => {
    const dup: ReminderRoutine = {
      ...routine,
      entries: [routine.entries[0]!, { ...routine.entries[0]!, id: undefined } as never],
    };
    const due = dueReminders(profile, dup, at(8, 43));
    expect(due.filter((r) => r.kind === "class_ends_soon")).toHaveLength(1);
  });
});
