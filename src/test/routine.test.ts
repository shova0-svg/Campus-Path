import { describe, expect, it } from "vitest";
import {
  classesInRoom,
  DEFAULT_ROUTINES,
  parseRoutineStore,
  parseRoutineText,
  roomFloor,
  roomsFromRoutine,
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

  it("creates rooms from routine cells with a floor from the room number", () => {
    const rooms = roomsFromRoutine(rpi3, "rpi");
    expect(rooms.length).toBeGreaterThan(3);
    expect(rooms.some((r) => r.name === "Room 2302" && r.floor === 2)).toBe(true);
    expect(roomFloor("5201")).toBe(5);
    expect(new Set(rooms.map((r) => r.id)).size).toBe(rooms.length);
  });

  it("finds all classes happening in a room across routines", () => {
    const classes = classesInRoom(DEFAULT_ROUTINES, "2306");
    expect(classes.length).toBeGreaterThan(3);
    expect(classes.every((c) => c.room === "2306")).toBe(true);
  });

  it("updates a routine in place", () => {
    const next = upsertRoutine(DEFAULT_ROUTINES, { ...rpi1, verified: true });
    expect(next).toHaveLength(2);
    expect(next.find((r) => r.id === rpi1.id)?.verified).toBe(true);
  });
});
