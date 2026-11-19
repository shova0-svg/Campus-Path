import { INSTITUTES, type CampusLocation } from "@/lib/campus-data";

/** The only Google account allowed to unlock Admin Mode. */
export const ADMIN_EMAIL = "Shovaslks@gmail.com";

/** Email addresses are case-insensitive, so compare after trimming and lowercasing. */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

/* ---------------- Room store (per institute, saved in localStorage) ---------------- */

export type LocationStore = Record<string, CampusLocation[]>;

export const STORE_KEY = "sohoj-rasta-locations-v2";
export const LEGACY_CUSTOM_KEY = "sohoj-rasta-custom-locations";
export const ADMIN_SESSION_KEY = "sohoj-rasta-admin-session";

export function defaultStore(legacyCustom: LocationStore = {}): LocationStore {
  const store: LocationStore = {};
  for (const inst of INSTITUTES) {
    store[inst.id] = [...(legacyCustom[inst.id] ?? []), ...inst.locations];
  }
  return store;
}

function safeParse(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Reads the saved store, falling back to the built-in rooms plus any rooms saved by the older version. */
export function parseStore(raw: string | null, legacyRaw: string | null): LocationStore {
  const saved = safeParse(raw);
  if (saved && typeof saved === "object" && !Array.isArray(saved)) {
    const store = defaultStore();
    for (const [id, list] of Object.entries(saved as Record<string, unknown>)) {
      if (Array.isArray(list)) store[id] = list as CampusLocation[];
    }
    return store;
  }
  const legacy = safeParse(legacyRaw);
  return defaultStore(legacy && typeof legacy === "object" ? (legacy as LocationStore) : {});
}

/** Adds a new room, or replaces the room with the same id (moving it if the institute changed). */
export function upsertLocation(store: LocationStore, instituteId: string, loc: CampusLocation): LocationStore {
  const next: LocationStore = {};
  let replaced = false;
  for (const [id, list] of Object.entries(store)) {
    if (id === instituteId) {
      const idx = list.findIndex((l) => l.id === loc.id);
      if (idx >= 0) {
        replaced = true;
        next[id] = list.map((l, i) => (i === idx ? loc : l));
      } else {
        next[id] = list;
      }
    } else {
      next[id] = list.filter((l) => l.id !== loc.id);
    }
  }
  if (!replaced) next[instituteId] = [loc, ...(next[instituteId] ?? [])];
  return next;
}

export function deleteLocation(store: LocationStore, instituteId: string, locationId: string): LocationStore {
  return { ...store, [instituteId]: (store[instituteId] ?? []).filter((l) => l.id !== locationId) };
}
