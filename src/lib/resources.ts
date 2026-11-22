import { createResource } from "@/lib/cache";
import { defaultAdmins } from "@/lib/admin";
import { INSTITUTES } from "@/lib/campus-data";
import { DEFAULT_ROUTINES } from "@/lib/routine";
import { TEACHERS } from "@/lib/teachers";
import { listAdmins } from "@/lib/repo/admins";
import { listBuildings, type StoredBuilding } from "@/lib/repo/buildings";
import { listRooms, type StoredRoom } from "@/lib/repo/rooms";
import { listTeachers } from "@/lib/repo/teachers";

function seedBuildings(): StoredBuilding[] {
  return INSTITUTES.flatMap((i) =>
    i.buildings.map((b) => ({ ...b, instituteId: i.id, isCustom: false })),
  );
}

function seedRooms(): StoredRoom[] {
  return INSTITUTES.flatMap((i) => i.locations.map((r) => ({ ...r, instituteId: i.id })));
}

export const buildingsResource = createResource<StoredBuilding[]>({
  key: "sohoj-rasta-buildings-v2",
  event: "sohoj:buildings-changed",
  seed: seedBuildings,
  fetcher: listBuildings,
});

export const roomsResource = createResource<StoredRoom[]>({
  key: "sohoj-rasta-locations-v3",
  event: "sohoj:rooms-changed",
  seed: seedRooms,
  fetcher: listRooms,
});

export const routinesResource = createResource<typeof DEFAULT_ROUTINES>({
  key: "sohoj-rasta-routines-v2",
  event: "sohoj:routines-changed",
  seed: () => DEFAULT_ROUTINES,
  // Only the two code routines are authoritative; cached/remote rows never inject others.
  fetcher: async () => DEFAULT_ROUTINES,
});

export const teachersResource = createResource<typeof TEACHERS>({
  key: "sohoj-rasta-teachers-v2",
  event: "sohoj:teachers-changed",
  seed: () => TEACHERS,
  fetcher: listTeachers,
});

export const adminsResource = createResource<ReturnType<typeof defaultAdmins>>({
  key: "sohoj-rasta-admins-v1",
  event: "sohoj:admins-changed",
  seed: defaultAdmins,
  fetcher: listAdmins,
});

/** Kick off background revalidation once the app mounts. */
export function startSync(): () => void {
  void buildingsResource.refresh();
  void roomsResource.refresh();
  void routinesResource.refresh();
  void teachersResource.refresh();
  void adminsResource.refresh();
  return () => {};
}
