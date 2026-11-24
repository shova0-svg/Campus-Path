import { describe, expect, it } from "vitest";
import { buildRoute, INSTITUTES, MAIN_GATE, type CampusLocation } from "@/lib/campus-data";
import {
  MAX_ADMINS_PER_INSTITUTE,
  isSubAdminAccount,
  subAdminSlotsUsed,
  type LocationStore,
  addInstituteAdmin,
  adminProfile,
  canManageInstitute,
  defaultAdmins,
  defaultBuildingStore,
  defaultStore,
  deleteBuilding,
  deleteLocation,
  isAdmin,
  isAdminEmail,
  loadAdmins,
  parseBuildingStore,
  parseStore,
  removeInstituteAdmin,
  upsertBuilding,
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

describe("Per-institute admins", () => {
  it("always keeps the super admin with access to every institute", () => {
    const accounts = defaultAdmins();
    expect(adminProfile("SHOVASLKS@GMAIL.COM", accounts)?.role).toBe("super");
    expect(canManageInstitute("shovaslks@gmail.com", "rpi", accounts)).toBe(true);
    expect(canManageInstitute("shovaslks@gmail.com", "dpi", accounts)).toBe(true);
  });

  it("adds institute admins and limits them to their own polytechnic", () => {
    const first = addInstituteAdmin(
      defaultAdmins(),
      "teacher@rpi.edu",
      "rpi",
      "shovaslks@gmail.com",
    );
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const accounts = first.accounts;
    expect(isAdmin("teacher@rpi.edu", accounts)).toBe(true);
    expect(canManageInstitute("teacher@rpi.edu", "rpi", accounts)).toBe(true);
    expect(canManageInstitute("teacher@rpi.edu", "dpi", accounts)).toBe(false);
    expect(adminProfile("teacher@rpi.edu", loadAdmins(JSON.stringify(accounts)))?.instituteId).toBe(
      "rpi",
    );
  });

  it("allows at most two admins per institute and can remove them", () => {
    let accounts = defaultAdmins();
    for (let i = 1; i <= MAX_ADMINS_PER_INSTITUTE; i++) {
      const r = addInstituteAdmin(accounts, `admin${i}@rpi.edu`, "rpi", "shovaslks@gmail.com");
      if (r.ok) accounts = r.accounts;
    }
    expect(accounts.filter((a) => a.instituteId === "rpi")).toHaveLength(MAX_ADMINS_PER_INSTITUTE);
    expect(
      addInstituteAdmin(accounts, "third@rpi.edu", "rpi", "shovaslks@gmail.com"),
    ).toMatchObject({
      ok: false,
    });
    accounts = removeInstituteAdmin(accounts, "admin1@rpi.edu");
    expect(accounts.some((a) => a.email === "admin1@rpi.edu")).toBe(false);
    expect(accounts[0]?.role).toBe("super");
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
      {
        ...newRoom,
        walkingSteps: 140,
        directions: ["Walk to the Red Building", "Turn left at the filter"],
      },
      rpi.buildings,
    );
    expect(route.walkingSteps).toBe(140);
    expect(route.steps.map((s) => s.detail)).toEqual([
      "Walk to the Red Building",
      "Turn left at the filter",
    ]);
  });
});

describe("Admin-managed buildings", () => {
  const workshop = {
    id: "building-workshop",
    name: "Workshop Building",
    look: "Grey workshop beside the field",
    isAcademic: false,
    distance: {
      "main-gate": 120,
      "shaheed-minar": 80,
      "academic-ground": 60,
      "academic-entrance": 55,
    },
  };

  it("starts from the built-in buildings per institute", () => {
    expect(defaultBuildingStore()["rpi"]).toEqual(rpi.buildings);
    expect(parseBuildingStore(null)["rpi"]).toEqual(rpi.buildings);
  });

  it("adds, edits and deletes a building for one institute only", () => {
    let store = upsertBuilding(defaultBuildingStore(), "rpi", workshop);
    expect(store["rpi"]?.some((b) => b.id === workshop.id)).toBe(true);
    expect(store["dpi"]?.some((b) => b.id === workshop.id)).toBe(false);

    store = upsertBuilding(store, "rpi", { ...workshop, name: "Central Workshop" });
    expect(store["rpi"]?.find((b) => b.id === workshop.id)?.name).toBe("Central Workshop");
    expect(store["rpi"]).toHaveLength(rpi.buildings.length + 1);

    store = deleteBuilding(store, "rpi", workshop.id);
    expect(store["rpi"]?.some((b) => b.id === workshop.id)).toBe(false);
  });

  it("restores saved buildings after a refresh", () => {
    const saved = JSON.stringify(upsertBuilding(defaultBuildingStore(), "rpi", workshop));
    expect(parseBuildingStore(saved)["rpi"]?.some((b) => b.name === "Workshop Building")).toBe(
      true,
    );
  });

  it("counts sub-admin slots and distinguishes super admins", () => {
    const accounts = defaultAdmins();
    const first = addInstituteAdmin(accounts, "a@rpi.edu", "rpi", "shovaslks@gmail.com");
    const withTwo = first.ok ? first.accounts : accounts;
    const second = addInstituteAdmin(withTwo, "b@rpi.edu", "rpi", "shovaslks@gmail.com");
    const full = second.ok ? second.accounts : withTwo;
    expect(MAX_ADMINS_PER_INSTITUTE).toBe(2);
    expect(subAdminSlotsUsed(full, "rpi")).toBe(2);
    expect(subAdminSlotsUsed(full, "bpi")).toBe(0);
    expect(isSubAdminAccount(adminProfile("a@rpi.edu", full))).toBe(true);
    expect(isSubAdminAccount(adminProfile("shovaslks@gmail.com", full))).toBe(false);
  });

  it("adds newly shipped buildings to an older saved list", () => {
    const oldOnly = JSON.stringify({ rpi: [workshop] });
    const merged = parseBuildingStore(oldOnly)["rpi"] ?? [];
    expect(merged.some((b) => b.name === "Workshop Building")).toBe(true);
    expect(merged.some((b) => b.name === "Electrical Department Building")).toBe(true);
    expect(merged).toHaveLength(defaultBuildingStore()["rpi"]!.length + 1);
  });
});
