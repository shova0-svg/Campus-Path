import { describe, expect, it } from "vitest";
import {
  classesInRoom,
  currentClassesInRoom,
  DEFAULT_ROUTINES,
  formatRoomCode,
  mergeRoutineRooms,
  parseRoomCode,
  parseRoutineStore,
  parseRoutineText,
  roomFloor,
  roomsFromRoutine,
  sortRooms,
  upsertRoutine,
} from "@/lib/routine";

const rpi3 = DEFAULT_ROUTINES.find((r) => r.id === "rpi-cst-3-morning")!;
const rpi1 = DEFAULT_ROUTINES.find((r) => r.id === "rpi-cst-1-morning")!;

describe("Rajshahi CST routines", () => {
  it("ships 1st and 3rd semester morning routines", () => {
    expect(DEFAULT_ROUTINES.map((r) => [r.semester, r.shift])).toEqual([
      [1, "Morning"],
      [3, "Morning"],
    ]);
    expect(DEFAULT_ROUTINES.every((r) => r.instituteId === "rpi" && r.entries.length > 0)).toBe(
      true,
    );
  });

  it("has the 3rd semester subjects, teachers and rooms", () => {
    const python = rpi3.entries.find((e) => e.code === "28531")!;
    expect(python.subject).toBe("Application Development Using Python");
    expect(python.teacher).toBe("MD. SORIAT ULLAH");
    expect(python.room).toBe("1308");
    expect(rpi3.entries.some((e) => e.code === "26831" && e.room === "5201")).toBe(true);
  });

  it("falls back to the two seeded routines when storage is empty", () => {
    expect(parseRoutineStore(null).map((r) => r.id)).toEqual(DEFAULT_ROUTINES.map((r) => r.id));
  });
});

describe("auto routine maker", () => {
  it("parses pasted day/period text into entries with rooms", () => {
    const entries = parseRoutineText(
      ["Sunday", "1: 28533 MSU 2302", "2: 25922 NN 2106", "Monday", "1: 28533 AAM 1305"].join("\n"),
    );
    expect(entries).toHaveLength(3);
    expect(entries[0]).toMatchObject({
      day: "Sunday",
      period: 1,
      code: "28533",
      acronym: "MSU",
      room: "2302",
    });
    expect(entries[2]?.day).toBe("Monday");
  });

  it("uses the room-code serial: building → floor → room (1305 = B1, 3rd floor, room 05)", () => {
    expect(parseRoomCode("1305")).toEqual({ buildingNo: 1, floor: 3, roomNo: 5 });
    expect(roomFloor("1305")).toBe(3);
    expect(formatRoomCode("1305")).toBe("Building 1 · 3rd Floor · Room 05");
    expect(parseRoomCode("205")).toBeNull();
  });

  it("creates rooms from routine cells with the code breakdown", () => {
    const rooms = roomsFromRoutine(rpi3, "rpi");
    expect(rooms.length).toBeGreaterThan(3);
    expect(
      rooms.some(
        (r) => r.name === "Room 1305" && r.floor === 3 && r.buildingNo === 1 && r.roomNo === 5,
      ),
    ).toBe(true);
    expect(new Set(rooms.map((r) => r.id)).size).toBe(rooms.length);
  });

  it("sorts rooms by building, then floor, then room number", () => {
    const sorted = sortRooms([
      { name: "Room 1308" },
      { name: "Room 2302" },
      { name: "Room 1205" },
      { name: "Room 1305" },
    ] as Parameters<typeof sortRooms>[0]);
    expect(sorted.map((r) => r.name)).toEqual(["Room 1205", "Room 1305", "Room 1308", "Room 2302"]);
  });

  it("finds all classes happening in a room across routines, with the teacher", () => {
    const classes = classesInRoom(DEFAULT_ROUTINES, "2306");
    expect(classes.length).toBeGreaterThan(3);
    expect(classes.every((c) => c.room === "2306")).toBe(true);
    expect(
      classes.some((c) => c.teacher === "ANJUMAN ARA" && c.subject === "Mathematics-III"),
    ).toBe(true);
  });

  it("merges routine room numbers (e.g. 1305) into the room store once", () => {
    const first = mergeRoutineRooms({}, DEFAULT_ROUTINES);
    expect(first["rpi"]?.some((r) => r.name === "Room 1305" && r.floor === 3)).toBe(true);
    const again = mergeRoutineRooms(first, DEFAULT_ROUTINES);
    expect(again["rpi"]).toHaveLength(first["rpi"]!.length);
  });

  it("migrates rooms saved with the old floor number", () => {
    const old = {
      rpi: [
        {
          id: "routine-room-1305-rpi",
          name: "Room 1305",
          category: "classroom",
          buildingId: "academic",
          floor: 1,
          turn: "right",
          landmark: "Academic Building corridor",
          side: "left",
          door: 1,
        },
      ],
    } as Parameters<typeof mergeRoutineRooms>[0];
    const fixed = mergeRoutineRooms(old, DEFAULT_ROUTINES)["rpi"]?.find(
      (r) => r.id === "routine-room-1305-rpi",
    );
    expect(fixed?.floor).toBe(3);
    expect(fixed?.buildingNo).toBe(1);
  });

  it("finds the class happening right now in a room with its teacher", () => {
    // Sunday 12:00 → period 6; 3rd sem has Mathematics-III (ANJUMAN ARA) in Room 2306.
    const now = new Date("2026-11-22T12:00:00");
    expect(now.getDay()).toBe(0);
    const live = currentClassesInRoom(DEFAULT_ROUTINES, "Room 2306", now);
    expect(live).toHaveLength(1);
    expect(live[0]).toMatchObject({
      subject: "Mathematics-III",
      teacher: "ANJUMAN ARA",
      room: "2306",
    });
    expect(currentClassesInRoom(DEFAULT_ROUTINES, "Room 1305", now)).toHaveLength(0);
  });

  it("updates a routine in place", () => {
    const next = upsertRoutine(DEFAULT_ROUTINES, { ...rpi1, verified: true });
    expect(next).toHaveLength(2);
    expect(next.find((r) => r.id === rpi1.id)?.verified).toBe(true);
  });
});
