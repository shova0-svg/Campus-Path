import { describe, expect, it } from "vitest";
import {
  allCampusRooms,
  blockRange,
  buildingIdForRoom,
  DEFAULT_ROUTINES,
  ROUTINE_1,
  ROUTINE_3,
  ROUTINES,
  ROUTINE_STORE_KEY,
  parseRoutineStore,
  periodMinutes,
} from "@/lib/routine";
import { matchRoutine, nextClassJourney, type StudentProfile } from "@/lib/student";

const profile = (semester: number, overrides: Partial<StudentProfile> = {}): StudentProfile => ({
  email: "student@example.com",
  name: "Test",
  instituteId: "rpi",
  department: "Computer Science & Technology",
  semester,
  shift: "Morning",
  ...overrides,
});

// Dhaka is UTC+6. 2026-11-22 is a Sunday, 2026-11-26 a Thursday, 2026-11-27 a Friday.
const dhaka = (date: string, hour: number, minute: number) =>
  new Date(`${date}T${String(hour - 6).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00Z`);

describe("data accuracy", () => {
  it("has exactly two routines with the specified metadata", () => {
    expect(ROUTINES).toHaveLength(2);
    expect(DEFAULT_ROUTINES).toHaveLength(2);
    expect(ROUTINES.map((r) => [r.semester, r.shift, r.classStart, r.classLoad])).toEqual([
      [1, 1, "2026-10-11", 33],
      [3, 1, "2026-09-27", 34],
    ]);
    expect(ROUTINES.every((r) => r.institute === "rpi" && r.department === "CST")).toBe(true);
  });

  for (const routine of [ROUTINE_1, ROUTINE_3]) {
    describe(`semester ${routine.semester}`, () => {
      it("block periods add up to classLoad", () => {
        const sum = routine.blocks.reduce((n, b) => n + (b.endPeriod - b.startPeriod + 1), 0);
        expect(sum).toBe(routine.classLoad);
      });

      it("has no overlapping blocks and every subject is used", () => {
        const used = new Set<string>();
        for (const day of ["Sun", "Mon", "Tue", "Wed", "Thu"] as const) {
          const blocks = routine.blocks.filter((b) => b.day === day);
          for (let i = 0; i < blocks.length; i++) {
            for (let j = i + 1; j < blocks.length; j++) {
              const a = blocks[i]!;
              const b = blocks[j]!;
              expect(a.startPeriod > b.endPeriod || b.startPeriod > a.endPeriod).toBe(true);
            }
          }
        }
        for (const b of routine.blocks) {
          expect(routine.subjects.some((s) => s.code === b.subjectCode)).toBe(true);
          used.add(b.subjectCode);
        }
        expect(used.size).toBe(routine.subjects.length);
      });

      it("uses only rooms that exist in the room list", () => {
        const rooms = new Set(allCampusRooms("rpi").map((r) => r.name.replace("Room ", "")));
        for (const b of routine.blocks) expect(rooms.has(b.room)).toBe(true);
      });
    });
  }

  it("spot checks: routine A", () => {
    expect(ROUTINE_1.blocks).toContainEqual({
      day: "Sun",
      startPeriod: 5,
      endPeriod: 7,
      subjectCode: "26711",
      room: "5208",
    });
    expect(ROUTINE_1.blocks).toContainEqual({
      day: "Wed",
      startPeriod: 1,
      endPeriod: 3,
      subjectCode: "28511",
      room: "1308",
    });
  });

  it("spot checks: routine B", () => {
    expect(ROUTINE_3.blocks).toContainEqual({
      day: "Tue",
      startPeriod: 5,
      endPeriod: 7,
      subjectCode: "28532",
      room: "1305",
    });
    expect(ROUTINE_3.blocks).toContainEqual({
      day: "Thu",
      startPeriod: 7,
      endPeriod: 7,
      subjectCode: "26831",
      room: "2306",
    });
    expect(ROUTINE_3.blocks.some((b) => b.day === "Sun" && b.startPeriod === 1)).toBe(false);
  });

  it("period times are 24h and block ranges are inclusive", () => {
    expect(periodMinutes(1)).toBe(8 * 60);
    expect(periodMinutes(7, true)).toBe(13 * 60 + 15);
    expect(
      blockRange({ day: "Sun", startPeriod: 5, endPeriod: 7, subjectCode: "x", room: "y" }),
    ).toEqual([11 * 60, 13 * 60 + 15]);
  });
});

describe("matchRoutine", () => {
  it("returns A for semester 1 and B for semester 3", () => {
    expect(matchRoutine(profile(1))).toBe(ROUTINE_1);
    expect(matchRoutine(profile(3))).toBe(ROUTINE_3);
  });

  it("returns null for unsupported semesters, institutes, departments and shifts", () => {
    for (const s of [2, 4, 5, 6]) expect(matchRoutine(profile(s))).toBeNull();
    expect(matchRoutine(profile(1, { instituteId: "dpi" }))).toBeNull();
    expect(matchRoutine(profile(1, { department: "Mechanical Technology" }))).toBeNull();
    expect(matchRoutine(profile(1, { shift: "Night" }))).toBeNull();
  });
});

describe("nextClassJourney", () => {
  const buildings = [
    { id: "non-departmental", distance: { "main-gate": 75 } },
  ] as unknown as Parameters<typeof nextClassJourney>[2];

  it("A on Sunday 08:50: current 25912 (ends 09:30), next 25911 room 2302 at 09:30", () => {
    const j = nextClassJourney(profile(1), dhaka("2026-11-22", 8, 50), buildings);
    expect(j).not.toBeNull();
    expect(j!.current?.subject.code).toBe("25912");
    expect(j!.currentEndsAt).toBe("09:30");
    expect(j!.next?.subject.code).toBe("25911");
    expect(j!.next?.block.room).toBe("2302");
    expect(j!.nextStartsAt).toBe("09:30");
    expect(j!.sameRoom).toBe(false);
  });

  it("A on Sunday 08:50 leaves in time for the room change", () => {
    const j = nextClassJourney(profile(1), dhaka("2026-11-22", 8, 50), buildings)!;
    expect(j.walkingMinutes).toBeGreaterThan(0);
    expect(j.leaveAt).not.toBeNull();
  });

  it("B on Thursday 13:00: current 26831, no next today → Sunday of next week, first block 28531 at 08:45", () => {
    const j = nextClassJourney(profile(3), dhaka("2026-11-26", 13, 0), buildings)!;
    expect(j.current?.subject.code).toBe("26831");
    expect(j.next?.subject.code).toBe("28531");
    expect(j.next?.block.day).toBe("Sun");
    expect(j.nextStartsAt).toBe("08:45");
  });

  it("Friday → next class is Sunday", () => {
    const j = nextClassJourney(profile(3), dhaka("2026-11-27", 10, 0), buildings)!;
    expect(j.day).toBeNull();
    expect(j.current).toBeNull();
    expect(j.next?.block.day).toBe("Sun");
    expect(j.nextStartsAt).toBe("08:45");
  });

  it("same room twice → no walking", () => {
    // Thursday periods 6 (25922) and 7 (26831) are both in room 2306.
    const j = nextClassJourney(profile(3), dhaka("2026-11-26", 12, 0), buildings)!;
    expect(j.current?.subject.code).toBe("25922");
    expect(j.next?.subject.code).toBe("26831");
    expect(j.next?.block.room).toBe("2306");
    expect(j.sameRoom).toBe(true);
    expect(j.walkingMinutes).toBe(0);
    expect(j.leaveAt).toBe(j.nextStartsAt);
  });

  it("returns null when the profile does not match", () => {
    expect(nextClassJourney(profile(2), dhaka("2026-11-22", 9, 0))).toBeNull();
  });
});

describe("legacy cache guard", () => {
  it("uses the v2 key and ignores v1 data", () => {
    expect(ROUTINE_STORE_KEY).toBe("sohoj-rasta-routines-v2");
    const old = [{ id: "old-routine", title: "old" }];
    expect(parseRoutineStore(JSON.stringify(old))).toEqual(DEFAULT_ROUTINES);
  });
});

describe("room-number serial logic", () => {
  it("keeps the existing building mapping", () => {
    expect(buildingIdForRoom("1305")).toBe("computer");
    expect(buildingIdForRoom("2106")).toBe("non-departmental");
    expect(buildingIdForRoom("4105")).toBe("civil");
    expect(buildingIdForRoom("5208")).toBe("electrical");
    expect(buildingIdForRoom("3109")).toBe("academic");
  });

  it("exposes every room range", () => {
    expect(allCampusRooms("rpi")).toHaveLength(76);
    expect(allCampusRooms("dpi")).toHaveLength(0);
  });
});
