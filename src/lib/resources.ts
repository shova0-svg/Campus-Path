import { createResource } from "@/lib/cache";
import { defaultAdmins } from "@/lib/admin";
import { INSTITUTES } from "@/lib/campus-data";
import { DEFAULT_ROUTINES, mergeWithCodeRoutines } from "@/lib/routine";
import { mergeWithSeedTeachers, TEACHERS } from "@/lib/teachers";
import { listAdmins } from "@/lib/repo/admins";
import { listBuildings, type StoredBuilding } from "@/lib/repo/buildings";
import { listRooms, type StoredRoom } from "@/lib/repo/rooms";
import { listTeachers } from "@/lib/repo/teachers";
import { listRoutines } from "@/lib/repo/routines";
import { listProducts } from "@/lib/repo/shop";
import { currentShopInstitute } from "@/lib/shop-scope";
import type { ShopProduct } from "@/lib/shop";

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
  key: "sohoj-rasta-routines-v4",
  event: "sohoj:routines-changed",
  seed: () => DEFAULT_ROUTINES,
  // Code routines are authoritative; cached/remote rows can only add extra admin routines.
  fetcher: async () => mergeWithCodeRoutines(await listRoutines().catch(() => null)),
});

export const teachersResource = createResource<typeof TEACHERS>({
  key: "sohoj-rasta-teachers-v2",
  event: "sohoj:teachers-changed",
  seed: () => TEACHERS,
  fetcher: async () => mergeWithSeedTeachers(await listTeachers().catch(() => null)),
});

export const shopFeedResource = createResource<ShopProduct[]>({
  key: "sohoj-rasta-shop-feed-v1",
  event: "sohoj:shop-changed",
  seed: () => [],
  fetcher: async () => (await listProducts(currentShopInstitute(), {}, 0, 20)).items,
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
  void shopFeedResource.refresh();
  void adminsResource.refresh();
  return () => {};
}
