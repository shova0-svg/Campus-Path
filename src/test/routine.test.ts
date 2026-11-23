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
  ROUTINES,
  ROUTINE_STORE_KEY,
  parseRoutineStore,
  DAYS,
  PERIODS,
} from "@/lib/routine";
import { NO_ROUTINE_MESSAGE, readRoutineView, routineForSemester } from "@/lib/routine-view";
import { closestCandidates, normalizeName, resolveTeacher } from "@/lib/routine-teachers";
import { TEACHERS, type Teacher } from "@/lib/teachers";
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

const dhaka = (date: string, hour: number, minute: number) =>
  new Date(`${date}T${String(hour - 6).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00Z`);

describe("data accuracy", () => {
  it("has exactly four routines with the specified metadata", () => {
    expect(ROUTINES).toHaveLength(4);
    expect(DEFAULT_ROUTINES).toHaveLength(4);
    expect(ROUTINES.map((r) => [r.semester, r.shift, r.classStart, r.classLoad])).toEqual([
      [1, 1, "2026-10-11", 33],
      [3, 1, "2026-09-27", 34],
      [4, 1, "2026-09-27", 35],
      [6, 1, "2026-09-27", 34],
    ]);
    expect(ROUTINES.every((r) => r.institute === "rpi" && r.department === "CST")).toBe(true);
  });

  for (const routine of [ROUTINE_1, ROUTINE_3, ROUTINE_4, ROUTINE_6]) {
    describe(`semester ${routine.semester}`, () => {
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

  it("spot checks: routine C (6th)", () => {
    expect(ROUTINE_6.blocks).toContainEqual({
      day: "Sun",
      startPeriod: 1,
      endPeriod: 3,
      subjectCode: "28565",
      room: "1308",
    });
    expect(ROUTINE_6.blocks).toContainEqual({
      day: "Mon",
      startPeriod: 5,
      endPeriod: 7,
      subjectCode: "28564",
      room: "1305",
    });
    expect(ROUTINE_6.blocks).toContainEqual({
      day: "Wed",
      startPeriod: 5,
      endPeriod: 7,
      subjectCode: "28566",
      room: "1302",
    });
    expect(ROUTINE_6.blocks.some((b) => b.day === "Sun" && b.startPeriod === 7)).toBe(false);
  });

  it("spot checks: routine D (4th)", () => {
    expect(ROUTINE_4.blocks).toContainEqual({
      day: "Sun",
      startPeriod: 5,
      endPeriod: 7,
      subjectCode: "28541",
      room: "1302",
    });
    expect(ROUTINE_4.blocks).toContainEqual({
      day: "Mon",
      startPeriod: 1,
      endPeriod: 3,
      subjectCode: "26841",
      room: "5201",
    });
    expect(ROUTINE_4.blocks).toContainEqual({
      day: "Wed",
      startPeriod: 5,
      endPeriod: 7,
      subjectCode: "28542",
      room: "1308",
    });
    expect(ROUTINE_4.blocks).toContainEqual({
      day: "Thu",
      startPeriod: 7,
      endPeriod: 7,
      subjectCode: "29041",
      room: "2303",
    });
  });

  it("no teacher or room is booked twice at the same day+period across routines", () => {
    const clashes: string[] = [];
    for (const day of DAYS) {
      for (const period of PERIODS) {
        const active = ROUTINES.flatMap((r) =>
          r.blocks
            .filter((b) => b.day === day && b.startPeriod <= period && period <= b.endPeriod)
            .map((b) => ({
              routine: r.semester,
              room: b.room,
              subject: b.subjectCode,
              teacher: r.subjects.find((s) => s.code === b.subjectCode)?.teacher ?? "",
            })),
        );
        for (let i = 0; i < active.length; i++) {
          for (let j = i + 1; j < active.length; j++) {
            const a = active[i]!;
            const b = active[j]!;
            if (a.room === b.room)
              clashes.push(`ROOM ${day} P${period}: sem ${a.routine}/${b.routine} in ${a.room}`);
            if (a.teacher === b.teacher)
              clashes.push(`TEACHER ${day} P${period}: ${a.teacher} sem ${a.routine}/${b.routine}`);
          }
        }
      }
    }
    expect(clashes, clashes.join("\n")).toHaveLength(0);
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
  it("returns A for 1, B for 3, D for 4 and C for 6", () => {
    expect(matchRoutine(profile(1))).toBe(ROUTINE_1);
    expect(matchRoutine(profile(3))).toBe(ROUTINE_3);
    expect(matchRoutine(profile(4))).toBe(ROUTINE_4);
    expect(matchRoutine(profile(6))).toBe(ROUTINE_6);
  });

  it("returns null for semesters 2 and 5 and for non-CST profiles", () => {
    for (const s of [2, 5]) expect(matchRoutine(profile(s))).toBeNull();
    expect(matchRoutine(profile(1, { instituteId: "dpi" }))).toBeNull();
    expect(matchRoutine(profile(1, { department: "Mechanical Technology" }))).toBeNull();
    expect(matchRoutine(profile(1, { shift: "Night" }))).toBeNull();
  });
});

describe("nextClassJourney with injected Dhaka time", () => {
  const buildings = [
    { id: "non-departmental", distance: { "main-gate": 75 } },
  ] as unknown as Parameters<typeof nextClassJourney>[2];

  it("A on Sunday 08:50: current 25912, next 25911 room 2302 at 09:30", () => {
    const j = nextClassJourney(profile(1), dhaka("2026-11-22", 8, 50), buildings)!;
    expect(j.current?.subject.code).toBe("25912");
    expect(j.currentEndsAt).toBe("09:30");
    expect(j.next?.subject.code).toBe("25911");
    expect(j.next?.block.room).toBe("2302");
    expect(j.nextStartsAt).toBe("09:30");
    expect(j.sameRoom).toBe(false);
  });

  it("D on Sunday 10:20: current 28542 room 1305 (ends 11:00), next 28541 room 1302 at 11:00", () => {
    const j = nextClassJourney(profile(4), dhaka("2026-11-22", 10, 20), buildings)!;
    expect(j.current?.subject.code).toBe("28542");
    expect(j.current?.block.room).toBe("1305");
    expect(j.currentEndsAt).toBe("11:00");
    expect(j.next?.subject.code).toBe("28541");
    expect(j.next?.block.room).toBe("1302");
    expect(j.nextStartsAt).toBe("11:00");
    expect(j.sameRoom).toBe(false);
  });

  it("C on Sunday 12:45: no current class (P7 free), next Monday 08:00 25852 room 2303", () => {
    const j = nextClassJourney(profile(6), dhaka("2026-11-22", 12, 45), buildings)!;
    expect(j.current).toBeNull();
    expect(j.next?.subject.code).toBe("25852");
    expect(j.next?.block.day).toBe("Mon");
    expect(j.next?.block.room).toBe("2303");
    expect(j.nextStartsAt).toBe("08:00");
  });

  it("D on Thursday 12:40: current 29041, next Sunday 08:00 28543 room 1305", () => {
    const j = nextClassJourney(profile(4), dhaka("2026-11-26", 12, 40), buildings)!;
    expect(j.current?.subject.code).toBe("29041");
    expect(j.next).not.toBeNull();
    expect(j.next?.subject.code).toBe("28543");
    expect(j.next?.block.day).toBe("Sun");
    expect(j.next?.block.room).toBe("1305");
    expect(j.nextStartsAt).toBe("08:00");
  });

  it("returns null when the profile has no routine", () => {
    expect(nextClassJourney(profile(2), dhaka("2026-11-22", 9, 0))).toBeNull();
  });
});

describe("routine dropdown", () => {
  it("selects semester 4 → D, 6 → C, 2 → friendly message", () => {
    expect(readRoutineView("4", 1)).toBe(4);
    expect(readRoutineView("6", 1)).toBe(6);
    expect(routineForSemester(4)).toBe(ROUTINE_4);
    expect(routineForSemester(6)).toBe(ROUTINE_6);
    expect(routineForSemester(2)).toBeNull();
    expect(routineForSemester(2) === null && NO_ROUTINE_MESSAGE.length > 0).toBe(true);
  });

  it("defaults to the student's semester when nothing was viewed", () => {
    expect(readRoutineView(null, 4)).toBe(4);
    expect(readRoutineView(null, null)).toBe(1);
  });

  it("stored data can never hide code routines", () => {
    expect(ROUTINE_STORE_KEY).toBe("sohoj-rasta-routines-v3");
    const old = [{ id: "old-routine", title: "old" }] as never as typeof DEFAULT_ROUTINES;
    const merged = parseRoutineStore(JSON.stringify(old));
    expect(merged.map((r) => r.id)).toContain("rpi-cst-4-1");
    expect(merged.map((r) => r.id)).toContain("rpi-cst-6-1");
    expect(mergeWithCodeRoutines(null)).toHaveLength(4);
  });
});

describe("rooms", () => {
  it("maps every room used by all four routines to the right building", () => {
    const expected: Record<string, string> = {
      "1302": "computer",
      "1305": "computer",
      "1308": "computer",
      "2302": "non-departmental",
      "2303": "non-departmental",
      "5201": "electrical",
    };
    for (const [room, building] of Object.entries(expected)) {
      expect(buildingIdForRoom(room)).toBe(building);
      expect(allCampusRooms("rpi").some((r) => r.name === `Room ${room}`)).toBe(true);
    }
  });
});

describe("teacher matching", () => {
  const mk = (name: string): Teacher => ({
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
    mobile: "",
    photo: "",
    facultyKey: "computer",
  });

  it("normalizes names and resolves exact / token matches", () => {
    expect(normalizeName("MD. ABDULLAH-AL MAMUN")).toBe("ABDULLAH AL MAMUN");
    const directory = [mk("MD. FARUQ HOSSAIN"), mk("MD. SORIAT ULLAH")];
    expect(resolveTeacher("MD. FARUQ HOSSAIN", directory)?.name).toBe("MD. FARUQ HOSSAIN");
    expect(resolveTeacher("FARUQ HOSSAIN", directory)?.name).toBe("MD. FARUQ HOSSAIN");
    expect(resolveTeacher("MD. UNKNOWN", directory)).toBeNull();
    expect(
      resolveTeacher("MD. FARUQ HOSSAIN", [mk("MD. FARUQ HOSSAIN"), mk("FARUQ HOSSAIN")]),
    ).toBeNull();
  });

  it("same acronym always resolves to the same person (synthetic English directory)", () => {
    const names = [...new Set(ROUTINES.flatMap((r) => r.subjects.map((s) => s.teacher)))];
    const directory = names.map(mk);
    const acronymToName = new Map<string, string>();
    for (const routine of ROUTINES) {
      for (const subject of routine.subjects) {
        const resolved = resolveTeacher(subject.teacher, directory);
        expect(resolved?.name).toBe(subject.teacher);
        const previous = acronymToName.get(subject.acronym);
        if (previous) expect(previous).toBe(subject.teacher);
        else acronymToName.set(subject.acronym, subject.teacher);
      }
    }
    expect(acronymToName.size).toBe(18);
  });

  it("prints the real-directory match report for the 18 routine teachers", () => {
    const expected = [
      "MD. ABDULLAH-AL MAMUN",
      "MST. RABEYA SIDDIQUA",
      "MD. SHIMUL HOSSAIN",
      "MD. ABDUR RAZZAK",
      "SYED MAHMUDUN NABI KHONDKER",
      "MD. FARUQ HOSSAIN",
      "MD. MOHOSIN",
      "SAMROZ NAHAR",
      "MST. NAZMUN NAHER",
      "ANJUMAN ARA",
      "MD. SORIAT ULLAH",
      "MD. AZIZUL AMAN AL AMIN",
      "MD. NURUN NOBE",
      "SYEDA SADIKA AKHTER JAHAN",
      "MST. RIYA KHATUN",
      "MD. SOHEL PARVAGE",
      "MD. FAZLUL HAQUE",
      "MD. MOHON ALI",
    ];
    const matched: string[] = [];
    const unmatched: string[] = [];
    for (const name of expected) {
      const teacher = resolveTeacher(name, TEACHERS);
      if (teacher) matched.push(`${name} -> ${teacher.name}`);
      else {
        const closest = closestCandidates(name, TEACHERS);
        unmatched.push(`${name} (closest: ${closest.length > 0 ? closest.join(", ") : "none"})`);
      }
    }
    console.log(
      "TEACHER MATCH REPORT\nMATCHED:\n" +
        (matched.join("\n") || "(none)") +
        "\nUNMATCHED:\n" +
        (unmatched.join("\n") || "(none)"),
    );
    expect(matched.length + unmatched.length).toBe(18);
  });
});
