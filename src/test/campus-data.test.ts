import { describe, expect, it } from "vitest";
import {
  buildRoute,
  DIVISION_ORDER,
  groupInstitutes,
  INSTITUTES,
  QR_START_POINT,
  MAIN_GATE,
  START_POINTS,
  searchLocations,
  type CampusLocation,
} from "@/lib/campus-data";

const rpi = INSTITUTES[0];

describe("Sohoj Rasta campus data", () => {
  it("defaults to Rajshahi Polytechnic and lists all 64 government/private institutes", () => {
    expect(INSTITUTES.slice(0, 3).map((i) => i.name)).toEqual([
      "Rajshahi Polytechnic Institute",
      "Dhaka Polytechnic Institute",
      "Bogura Polytechnic Institute",
    ]);
    expect(INSTITUTES).toHaveLength(64);
    expect(INSTITUTES.filter((i) => i.type === "government")).toHaveLength(52);
    expect(INSTITUTES.filter((i) => i.type === "private")).toHaveLength(12);
    expect(new Set(INSTITUTES.map((i) => i.id)).size).toBe(INSTITUTES.length);
    expect(INSTITUTES.every((i) => i.nameBn && i.city && i.buildings.length > 0)).toBe(true);
  });

  it("groups the dropdown by division and then private institutes", () => {
    expect(groupInstitutes(INSTITUTES).map((g) => g.label)).toEqual([
      ...DIVISION_ORDER.map((d) => `${d} Division`),
      "Private institutes",
    ]);
    expect(groupInstitutes(INSTITUTES).reduce((n, g) => n + g.items.length, 0)).toBe(64);
  });

  it("pre-loads at least 8 Rajshahi locations across all four categories", () => {
    expect(rpi.locations.length).toBeGreaterThanOrEqual(8);
    expect(new Set(rpi.locations.map((l) => l.category))).toEqual(
      new Set(["classroom", "lab", "office", "facility"]),
    );
  });

  it("offers Main Gate, Shaheed Minar and Academic Building Ground Floor as start points", () => {
    expect(START_POINTS.map((s) => s.name)).toEqual([
      "Main Gate",
      "Shaheed Minar",
      "Academic Building Ground Floor",
    ]);
    expect(QR_START_POINT.name).toBe("Academic Building Entrance");
  });

  it("attaches the Google campus map to Rajshahi Polytechnic only", () => {
    expect(rpi.map).toBeDefined();
    expect(rpi.map?.lat).toBeCloseTo(24.3791113, 6);
    expect(rpi.map?.lng).toBeCloseTo(88.606811, 6);
    expect(rpi.map?.link).toContain("google.com/maps/place/Rajshahi+Polytechnic+Institute");
    expect(rpi.map?.embedUrl).toContain("output=embed");
    expect(INSTITUTES.slice(1).every((i) => i.map === undefined)).toBe(true);
  });

  it("marks the campus roads, academic buildings, pond and ground on the map", () => {
    const kinds = new Set(rpi.map?.features.map((f) => f.kind));
    expect(kinds).toEqual(new Set(["gate", "landmark", "building", "pond", "ground"]));
    expect(rpi.map?.roads.length).toBeGreaterThan(0);
    expect(rpi.map?.features.some((f) => f.name === "Academic Building" && f.livePin)).toBe(true);
  });
});

describe("destination search", () => {
  it("finds a room by its number", () => {
    const r = searchLocations(rpi.locations, rpi.buildings, "205", "all");
    expect(r.map((l) => l.id)).toEqual(["rpi-205"]);
  });

  it("finds an office by its Bangla name", () => {
    const r = searchLocations(rpi.locations, rpi.buildings, "উপবৃত্তি", "all");
    expect(r.map((l) => l.id)).toEqual(["rpi-stipend"]);
  });

  it("filters by category", () => {
    const r = searchLocations(rpi.locations, rpi.buildings, "", "lab");
    expect(r.every((l) => l.category === "lab")).toBe(true);
    expect(r).toHaveLength(2);
  });

  it("includes a volunteer-added room in search results", () => {
    const added: CampusLocation = {
      id: "custom-1",
      name: "Room 304 (Power Tech)",
      category: "classroom",
      buildingId: "academic",
      floor: 3,
      turn: "left",
      landmark: "Blue water filter",
      side: "right",
      door: 1,
      custom: true,
    };
    const r = searchLocations([added, ...rpi.locations], rpi.buildings, "304", "classroom");
    expect(r.map((l) => l.id)).toEqual(["custom-1"]);
  });
});

describe("step-by-step route", () => {
  const room205 = rpi.locations.find((l) => l.id === "rpi-205")!;

  it("builds the Main Gate → Academic Building → 2nd Floor → Room 205 breadcrumb", () => {
    const route = buildRoute(MAIN_GATE, room205, rpi.buildings);
    expect(route.breadcrumb).toEqual(["Main Gate", "Academic Building", "2nd Floor", "Room 205"]);
  });

  it("always gives 3 to 4 direction steps", () => {
    for (const start of [...START_POINTS, QR_START_POINT]) {
      for (const loc of rpi.locations) {
        const n = buildRoute(start, loc, rpi.buildings).steps.length;
        expect(n).toBeGreaterThanOrEqual(3);
        expect(n).toBeLessThanOrEqual(4);
      }
    }
  });

  it("ends with the landmark turn and door position", () => {
    const route = buildRoute(MAIN_GATE, room205, rpi.buildings);
    expect(route.steps.at(-1)?.detail).toBe(
      "Turn left at the Red Notice Board — Room 205 is the 2nd door on your right.",
    );
  });
});
