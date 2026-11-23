import { describe, expect, it } from "vitest";
import {
  allCampusRooms,
  blockRange,
  buildingIdForRoom,
  DEFAULT_ROUTINES,
  mergeWithCodeRoutines,
  periodMinutes,
  ROUTINE_1,
  ROUTINE_3,
  ROUTINE_4,
  ROUTINE_6,
  ROUTINE_E,
  ROUTINE_F,
  ROUTINE_G,
  ROUTINE_H,
  ROUTINES,
  ROUTINE_STORE_KEY,
  parseRoutineStore,
  DAYS,
  PERIODS,
} from "@/lib/routine";
import {
  NO_ROUTINE_MESSAGE,
  readRoutineView,
  routineForSemester,
  ROUTINE_VIEW_KEY,
} from "@/lib/routine-view";
import {
  closestCandidates,
  normalizeName,
  normalizePhone,
  resolveTeacher,
} from "@/lib/routine-teachers";
import { TEACHERS, type Teacher } from "@/lib/teachers";
import { matchRoutine, nextClassJourney, parseShift, type StudentProfile } from "@/lib/student";

const ALL = [
  ROUTINE_1,
  ROUTINE_3,
  ROUTINE_4,
  ROUTINE_6,
  ROUTINE_E,
  ROUTINE_F,
  ROUTINE_G,
  ROUTINE_H,
];

const profile = (
  semester: number,
  shift: string | number = "1",
  overrides: Partial<StudentProfile> = {},
): StudentProfile => ({
  email: "student@example.com",
  name: "Test",
  instituteId: "rpi",
  department: "Computer Science & Technology",
  semester,
  shift: String(shift),
  ...overrides,
});

const dhaka = (date: string, hour: number, minute: number) =>
  new Date(`${date}T${String(hour - 6).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00Z`);

describe("data accuracy", () => {
  it("has exactly eight routines with the specified metadata", () => {
    expect(ROUTINES).toHaveLength(8);
    expect(DEFAULT_ROUTINES).toHaveLength(8);
    expect(ALL.map((r) => [r.semester, r.shift, r.classLoad])).toEqual([
      [1, 1, 33],
      [3, 1, 34],
      [4, 1, 35],
      [6, 1, 34],
      [1, 2, 34],
      [3, 2, 35],
      [4, 2, 35],
      [6, 2, 34],
    ]);
    expect(
      ALL.every(
        (r) =>
          (r.institute === "rpi" && r.department === "CST" && r.classStart === "2026-09-27") ||
          (r.semester === 1 && r.shift === 1),
      ),
    ).toBe(true);
    expect(ALL.filter((r) => r.shift === 2).every((r) => r.classStart === "2026-09-27")).toBe(true);
  });

  for (const routine of ALL) {
    describe(`semester ${routine.semester} shift ${routine.shift}`, () => {
      it("block periods add up to classLoad", () => {
        const sum = routine.blocks.reduce((n, b) => n + (b.endPeriod - b.startPeriod + 1), 0);
        expect(sum).toBe(routine.classLoad);
      });

      it("has no overlapping blocks and every subject is used", () => {
        const used = new Set<string>();
        for (const day of DAYS) {
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

  it("weekly periods equal T+P for E/F/G/H, with only the printed H exceptions warned", () => {
    const allowlist = new Set(["28562", "28565"]);
    const warnings: string[] = [];
    for (const routine of [ROUTINE_E, ROUTINE_F, ROUTINE_G, ROUTINE_H]) {
      for (const subject of routine.subjects) {
        const periods = routine.blocks
          .filter((b) => b.subjectCode === subject.code)
          .reduce((n, b) => n + (b.endPeriod - b.startPeriod + 1), 0);
        const expected = (subject.T ?? 0) + (subject.P ?? 0);
        if (periods !== expected) {
          if (routine === ROUTINE_H && allowlist.has(subject.code)) {
            warnings.push(`WARN H ${subject.code}: ${periods} periods, T+P=${expected}`);
          } else {
            throw new Error(
              `sem ${routine.semester} shift 2 ${subject.code}: ${periods} != ${expected}`,
            );
          }
        }
      }
    }
    console.log(warnings.join("\n"));
    expect(warnings).toHaveLength(2);
  });

  it("period times come from the selected shift", () => {
    expect(periodMinutes(1, false, 1)).toBe(8 * 60);
    expect(periodMinutes(1, false, 2)).toBe(13 * 60 + 30);
    expect(periodMinutes(7, true, 2)).toBe(18 * 60 + 45);
    expect(
      blockRange({ day: "Sun", startPeriod: 5, endPeriod: 7, subjectCode: "x", room: "y" }, 2),
    ).toEqual([16 * 60 + 30, 18 * 60 + 45]);
    expect(
      DEFAULT_ROUTINES.find((r) => r.semester === 4 && Number(r.shift) === 2)?.periods[0]?.time,
    ).toBe("13:30-14:15");
  });

  it("spot checks: shift 1 (A, B, C, D)", () => {
    expect(ROUTINE_1.blocks).toContainEqual({
      day: "Sun",
      startPeriod: 5,
      endPeriod: 7,
      subjectCode: "26711",
      room: "5208",
    });
    expect(ROUTINE_3.blocks).toContainEqual({
      day: "Tue",
      startPeriod: 5,
      endPeriod: 7,
      subjectCode: "28532",
      room: "1305",
    });
    expect(ROUTINE_6.blocks).toContainEqual({
      day: "Wed",
      startPeriod: 5,
      endPeriod: 7,
      subjectCode: "28566",
      room: "1302",
    });
    expect(ROUTINE_4.blocks).toContainEqual({
      day: "Wed",
      startPeriod: 5,
      endPeriod: 7,
      subjectCode: "28542",
      room: "1308",
    });
    expect(ROUTINE_4.blocks).toContainEqual({
      day: "Sun",
      startPeriod: 5,
      endPeriod: 7,
      subjectCode: "28541",
      room: "1302",
    });
  });

  it("spot checks: E", () => {
    expect(ROUTINE_E.blocks).toContainEqual({
      day: "Sun",
      startPeriod: 1,
      endPeriod: 3,
      subjectCode: "21011",
      room: "2305",
    });
    expect(ROUTINE_E.blocks).toContainEqual({
      day: "Mon",
      startPeriod: 2,
      endPeriod: 4,
      subjectCode: "26711",
      room: "5210",
    });
    expect(ROUTINE_E.blocks).toContainEqual({
      day: "Thu",
      startPeriod: 4,
      endPeriod: 6,
      subjectCode: "28511",
      room: "1302",
    });
    expect(ROUTINE_E.blocks.some((b) => b.day === "Sun" && b.startPeriod === 7)).toBe(false);
  });

  it("spot checks: F", () => {
    expect(ROUTINE_F.blocks).toContainEqual({
      day: "Mon",
      startPeriod: 1,
      endPeriod: 3,
      subjectCode: "28531",
      room: "1308",
    });
    expect(ROUTINE_F.blocks).toContainEqual({
      day: "Tue",
      startPeriod: 5,
      endPeriod: 7,
      subjectCode: "28533",
      room: "1305",
    });
    expect(ROUTINE_F.blocks).toContainEqual({
      day: "Wed",
      startPeriod: 4,
      endPeriod: 6,
      subjectCode: "28532",
      room: "1308",
    });
    expect(ROUTINE_F.blocks).toContainEqual({
      day: "Thu",
      startPeriod: 6,
      endPeriod: 6,
      subjectCode: "25811",
      room: "2306",
    });
  });

  it("spot checks: G", () => {
    expect(ROUTINE_G.blocks).toContainEqual({
      day: "Wed",
      startPeriod: 4,
      endPeriod: 6,
      subjectCode: "28543",
      room: "1305",
    });
    expect(ROUTINE_G.blocks).toContainEqual({
      day: "Sun",
      startPeriod: 5,
      endPeriod: 7,
      subjectCode: "28541",
      room: "1308",
    });
    expect(ROUTINE_G.blocks).toContainEqual({
      day: "Mon",
      startPeriod: 5,
      endPeriod: 7,
      subjectCode: "29041",
      room: "2206",
    });
    expect(ROUTINE_G.blocks).toContainEqual({
      day: "Tue",
      startPeriod: 5,
      endPeriod: 7,
      subjectCode: "28544",
      room: "1302",
    });
  });

  it("spot checks: H", () => {
    expect(ROUTINE_H.blocks.some((b) => b.day === "Tue" && b.startPeriod === 7)).toBe(false);
    expect(ROUTINE_H.blocks).toContainEqual({
      day: "Tue",
      startPeriod: 4,
      endPeriod: 4,
      subjectCode: "28561",
      room: "1302",
    });
    expect(ROUTINE_H.blocks).toContainEqual({
      day: "Wed",
      startPeriod: 5,
      endPeriod: 7,
      subjectCode: "28566",
      room: "1305",
    });
    expect(ROUTINE_H.blocks).toContainEqual({
      day: "Thu",
      startPeriod: 5,
      endPeriod: 7,
      subjectCode: "28564",
      room: "1305",
    });
  });

  it("clashes grouped per shift, with only the two printed allowlisted clashes", () => {
    const allowlist = new Set(["2|Tue|4|room|1302", "2|Wed|5|room|1305", "2|Wed|6|room|1305"]);
    const clashes: string[] = [];
    const allowedFound: string[] = [];
    for (const shift of [1, 2]) {
      const routines = ALL.filter((r) => r.shift === shift);
      for (const day of DAYS) {
        for (const period of PERIODS) {
          const active = routines.flatMap((r) =>
            r.blocks
              .filter((b) => b.day === day && b.startPeriod <= period && period <= b.endPeriod)
              .map((b) => {
                const subject = r.subjects.find((s) => s.code === b.subjectCode)!;
                return {
                  room: b.room,
                  teacher: normalizeName(subject.teacher),
                  phone: normalizePhone(subject.teacherPhone),
                };
              }),
          );
          for (let i = 0; i < active.length; i++) {
            for (let j = i + 1; j < active.length; j++) {
              const a = active[i]!;
              const b = active[j]!;
              if (a.room === b.room) {
                const key = `${shift}|${day}|${period}|room|${a.room}`;
                if (allowlist.has(key)) allowedFound.push(`WARN allowed clash: ${key}`);
                else clashes.push(`shift ${shift} ${day} P${period}: ROOM ${a.room}`);
              }
              if (
                a.teacher === b.teacher &&
                !(a.phone && b.phone && a.phone !== b.phone) &&
                !allowlist.has(`${shift}|${day}|${period}|teacher|${a.teacher}`)
              )
                clashes.push(`shift ${shift} ${day} P${period}: TEACHER ${a.teacher}`);
            }
          }
        }
      }
    }
    console.log(
      "CLASH REPORT\n" +
        (allowedFound.join("\n") || "(no allowlisted clashes found)") +
        "\nUnexpected: " +
        (clashes.join(" | ") || "none"),
    );
    expect(clashes, clashes.join("\n")).toHaveLength(0);
  });
});

describe("matchRoutine and profile shift", () => {
  it("defaults to shift 1 and maps both shifts", () => {
    expect(parseShift(undefined)).toBe(1);
    expect(parseShift("Morning")).toBe(1);
    expect(parseShift("Evening")).toBe(2);
    expect(matchRoutine(1)).toBe(ROUTINE_1);
    expect(matchRoutine(3)).toBe(ROUTINE_3);
    expect(matchRoutine(4)).toBe(ROUTINE_4);
    expect(matchRoutine(6)).toBe(ROUTINE_6);
    expect(matchRoutine(1, 2)).toBe(ROUTINE_E);
    expect(matchRoutine(3, 2)).toBe(ROUTINE_F);
    expect(matchRoutine(4, 2)).toBe(ROUTINE_G);
    expect(matchRoutine(6, 2)).toBe(ROUTINE_H);
    expect(matchRoutine(profile(4, 2))).toBe(ROUTINE_G);
    expect(matchRoutine(2, 1)).toBeNull();
    expect(matchRoutine(5, 2)).toBeNull();
  });
});

describe("nextClassJourney with injected Dhaka time", () => {
  const buildings = [
    { id: "computer", distance: { "main-gate": 60 } },
    { id: "non-departmental", distance: { "main-gate": 75 } },
  ] as unknown as Parameters<typeof nextClassJourney>[2];

  it("G Sunday 17:00: current 28541 room 1308, next Monday 13:30 28542 room 1302", () => {
    const j = nextClassJourney(profile(4, 2), dhaka("2026-11-22", 17, 0), buildings)!;
    expect(j.current?.subject.code).toBe("28541");
    expect(j.current?.block.room).toBe("1308");
    expect(j.currentEndsAt).toBe("18:45");
    expect(j.next?.subject.code).toBe("28542");
    expect(j.next?.block.day).toBe("Mon");
    expect(j.next?.block.room).toBe("1302");
    expect(j.nextStartsAt).toBe("13:30");
  });

  it("H Tuesday 18:10: no current (P7 free), next Wednesday 13:30 28564 room 2303", () => {
    const j = nextClassJourney(profile(6, 2), dhaka("2026-11-24", 18, 10), buildings)!;
    expect(j.current).toBeNull();
    expect(j.next?.subject.code).toBe("28564");
    expect(j.next?.block.day).toBe("Wed");
    expect(j.next?.block.room).toBe("2303");
    expect(j.nextStartsAt).toBe("13:30");
  });

  it("F Thursday 17:20: current 25811 room 2306, next 26831 room 2306 at 18:00 (same room)", () => {
    const j = nextClassJourney(profile(3, 2), dhaka("2026-11-26", 17, 20), buildings)!;
    expect(j.current?.subject.code).toBe("25811");
    expect(j.currentEndsAt).toBe("18:00");
    expect(j.next?.subject.code).toBe("26831");
    expect(j.nextStartsAt).toBe("18:00");
    expect(j.sameRoom).toBe(true);
  });

  it("E Sunday 18:10: no current, next Monday 13:30 25911 room 3209", () => {
    const j = nextClassJourney(profile(1, 2), dhaka("2026-11-22", 18, 10), buildings)!;
    expect(j.current).toBeNull();
    expect(j.next?.subject.code).toBe("25911");
    expect(j.next?.block.room).toBe("3209");
    expect(j.nextStartsAt).toBe("13:30");
  });

  it("1st-shift journey still works", () => {
    const j = nextClassJourney(profile(1, 1), dhaka("2026-11-22", 8, 50), buildings)!;
    expect(j.current?.subject.code).toBe("25912");
    expect(j.next?.subject.code).toBe("25911");
    expect(j.nextStartsAt).toBe("09:30");
  });
});

describe("routine dropdown selection", () => {
  it("selects semester+shift pairs and shows the friendly message for 2/5", () => {
    expect(readRoutineView(null, 4, 2)).toEqual({
      institute: "rpi",
      department: "cst",
      semester: 4,
      shift: 2,
    });
    expect(routineForSemester(4, 2)).toBe(ROUTINE_G);
    expect(routineForSemester(6, 2)).toBe(ROUTINE_H);
    expect(routineForSemester(1, 2)).toBe(ROUTINE_E);
    expect(routineForSemester(2, 1)).toBeNull();
    expect(routineForSemester(5, 2)).toBeNull();
    expect(NO_ROUTINE_MESSAGE.length).toBeGreaterThan(0);
  });

  it("ignores stale v1 values and invalid data", () => {
    expect(ROUTINE_VIEW_KEY).toBe("routine-view-v2");
    expect(readRoutineView("1", 3, 2).semester).toBe(3);
    expect(readRoutineView("garbage", 6, 2).semester).toBe(6);
  });

  it("stored data can never hide code routines", () => {
    expect(ROUTINE_STORE_KEY).toBe("sohoj-rasta-routines-v4");
    const old = [{ id: "old-routine", title: "old" }] as never as typeof DEFAULT_ROUTINES;
    const ids = parseRoutineStore(JSON.stringify(old)).map((r) => r.id);
    for (const id of [
      "rpi-cst-1-1",
      "rpi-cst-s1-shift2",
      "rpi-cst-s3-shift2",
      "rpi-cst-s4-shift2",
      "rpi-cst-s6-shift2",
    ])
      expect(ids).toContain(id);
    expect(mergeWithCodeRoutines(null)).toHaveLength(8);
  });
});

describe("rooms", () => {
  it("maps every room of all 8 routines to the right building", () => {
    const expected: Record<string, string> = {
      "1302": "computer",
      "1305": "computer",
      "1308": "computer",
      "2106": "non-departmental",
      "2206": "non-departmental",
      "2303": "non-departmental",
      "2305": "non-departmental",
      "2306": "non-departmental",
      "5202": "electrical",
      "5206": "electrical",
      "5210": "electrical",
      "3209": "academic",
      "3402": "academic",
    };
    for (const [room, building] of Object.entries(expected)) {
      expect(buildingIdForRoom(room)).toBe(building);
      expect(allCampusRooms("rpi").some((r) => r.name === `Room ${room}`)).toBe(true);
    }
  });
});

describe("teacher matching", () => {
  const mk = (name: string, mobile = ""): Teacher => ({
    serial: "1",
    name,
    designation: "",
    faculty: "",
    department: "",
    office: "",
    email: "",
    batch: "",
    phoneOffice: "",
    phoneHome: "",
    room: "",
    mobile,
    photo: "",
    facultyKey: "computer",
  });

  it("normalizes names and phones", () => {
    expect(normalizeName("MD. ABDULLAH-AL MAMUN")).toBe("ABDULLAH AL MAMUN");
    expect(normalizePhone("+8801712345678")).toBe("01712345678");
    expect(normalizePhone("০১৭১২৩৪৫৬৭৮")).toBe("01712345678");
  });

  it("phone match wins and resolves across spelling differences", () => {
    const directory = [mk("Md. Zahangir Alom", "01774592866")];
    expect(resolveTeacher("Totally Different Name", "01774592866", directory)?.name).toBe(
      "Md. Zahangir Alom",
    );
    expect(resolveTeacher("Md. Zahangir Alom", "01774592866", directory)?.name).toBe(
      "Md. Zahangir Alom",
    );
  });

  it("significant tokens prevent false merges and acronyms are never used", () => {
    const directory = [mk("MD. ABDULLAH-AL MAMUN"), mk("MD. MOHOSIN"), mk("MD. MOHON ALI")];
    expect(resolveTeacher("Md. Al-Mamun", undefined, directory)).toBeNull();
    expect(resolveTeacher("Abdullah Al Mahmud", undefined, directory)).toBeNull();
    expect(resolveTeacher("AAM", undefined, directory)).toBeNull();
    expect(resolveTeacher("MM", undefined, directory)).toBeNull();
  });

  it("ambiguous or unknown names return null", () => {
    expect(
      resolveTeacher("Md. Shahinul Islam", undefined, [
        mk("Md. Shahinul Islam"),
        mk("Shahinul Islam"),
      ]),
    ).toBeNull();
    expect(resolveTeacher("Nobody Here", undefined, [mk("MD. MOHOSIN")])).toBeNull();
  });

  it("prints the match report for all distinct teachers of all 8 routines", () => {
    const names = [
      ...new Set(
        ALL.flatMap((r) => r.subjects.map((s) => [s.teacher, s.teacherPhone ?? ""] as const)),
      ),
    ];
    const matched: string[] = [];
    const unmatched: string[] = [];
    for (const [name, phone] of names) {
      const byPhone = phone
        ? TEACHERS.filter((t) => normalizePhone(t.mobile) === normalizePhone(phone))
        : [];
      const byName = resolveTeacher(name, undefined, TEACHERS);
      const found = resolveTeacher(name, phone, TEACHERS);
      if (found) {
        const how =
          byPhone.length === 1
            ? "phone"
            : normalizeName(found.name) === normalizeName(name)
              ? "exact"
              : "token";
        matched.push(`${name} -> ${found.name} (${how})`);
      } else {
        const closest = closestCandidates(name, TEACHERS);
        unmatched.push(`${name} (closest: ${closest.length ? closest.join(", ") : "none"})`);
      }
    }
    console.log(
      "TEACHER MATCH REPORT\nMATCHED:\n" +
        (matched.join("\n") || "(none)") +
        "\nUNMATCHED:\n" +
        (unmatched.join("\n") || "(none)"),
    );
    console.log(
      "POSSIBLE SAME PERSON: MA — MD. MOHON ALI (1st shift) / Mohammad Ali (2nd shift) — kept separate",
    );
    expect(matched.length + unmatched.length).toBeGreaterThanOrEqual(36);
  });
});
