import { describe, expect, it } from "vitest";
import { buildRoute, INSTITUTES, MAIN_GATE, type CampusLocation } from "@/lib/campus-data";
import {
  type LocationStore,
  defaultStore,
  deleteLocation,
  isAdminEmail,
  parseStore,
  upsertLocation,
} from "@/lib/admin";

const rpi = INSTITUTES[0];
const rooms = (store: LocationStore, id: string) => store[id] ?? [];
const room205 = rpi.locations.find((l) => l.id === "rpi-205")!;

const newRoom: CampusLocation = {
  id: "custom-1",
  name: "Room 304 (Power Tech)",
  category: "classroom",
  buildingId: "academic",
  floor: 3,
  turn: "left",
  side: "right",
  door: 2,
  landmark: "Blue water filter",
  custom: true,
};

describe("Admin access", () => {
  it("unlocks Admin Mode for Shovaslks@gmail.com", () => {
    expect(isAdminEmail("Shovaslks@gmail.com")).toBe(true);
  });

  it("denies any other email", () => {
    expect(isAdminEmail("someone@gmail.com")).toBe(false);
    expect(isAdminEmail("shovaslks@gmail.com.evil.com")).toBe(false);
    expect(isAdminEmail("")).toBe(false);
  });
});

describe("Admin room changes", () => {
  it("adds a new room to the chosen institute", () => {
    const next = upsertLocation(defaultStore(), "rpi", newRoom);
    expect(rooms(next, "rpi")[0]?.id).toBe("custom-1");
    expect(rooms(next, "rpi")).toHaveLength(rpi.locations.length + 1);
  });

  it("edits an existing room in place", () => {
    const next = upsertLocation(defaultStore(), "rpi", { ...room205, name: "Room 205 (CST)" });
    expect(rooms(next, "rpi").find((l) => l.id === "rpi-205")?.name).toBe("Room 205 (CST)");
    expect(rooms(next, "rpi")).toHaveLength(rpi.locations.length);
  });

  it("moves a room when its institute is changed", () => {
    const next = upsertLocation(defaultStore(), "dpi", room205);
    expect(rooms(next, "rpi").some((l) => l.id === "rpi-205")).toBe(false);
    expect(rooms(next, "dpi").some((l) => l.id === "rpi-205")).toBe(true);
  });

  it("deletes a built-in room", () => {
    const next = deleteLocation(defaultStore(), "rpi", "rpi-205");
    expect(rooms(next, "rpi").some((l) => l.id === "rpi-205")).toBe(false);
  });

  it("restores saved changes after a refresh", () => {
    const saved = JSON.stringify(deleteLocation(defaultStore(), "rpi", "rpi-205"));
    expect(rooms(parseStore(saved, null), "rpi").some((l) => l.id === "rpi-205")).toBe(false);
  });

  it("keeps rooms added before the admin panel existed", () => {
    const legacy = JSON.stringify({ rpi: [newRoom] });
    expect(rooms(parseStore(null, legacy), "rpi")[0]?.id).toBe("custom-1");
  });

  it("uses the admin's walking steps and written directions", () => {
    const route = buildRoute(
      MAIN_GATE,
      { ...newRoom, walkingSteps: 140, directions: ["Walk to the Red Building", "Turn left at the filter"] },
      rpi.buildings,
    );
    expect(route.walkingSteps).toBe(140);
    expect(route.steps.map((s) => s.detail)).toEqual(["Walk to the Red Building", "Turn left at the filter"]);
  });
});
