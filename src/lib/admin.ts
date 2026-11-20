import { INSTITUTES, type CampusLocation } from "@/lib/campus-data";

/** The super admin can manage every institute and every admin account. */
export const ADMIN_EMAIL = "Shovaslks@gmail.com";

/** Email addresses are case-insensitive, so compare after trimming and lowercasing. */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

/* ---------------- Admin accounts (super + per-institute) ---------------- */

export const MAX_ADMINS_PER_INSTITUTE = 5;
export const ADMINS_STORE_KEY = "sohoj-rasta-admins-v1";

export interface AdminAccount {
  email: string;
  /** Institute id, or "all" for the super admin. */
  instituteId: string | "all";
  role: "super" | "institute";
  addedBy: string;
  addedAt: string;
}

const SUPER_ADMIN_ACCOUNT: AdminAccount = {
  email: ADMIN_EMAIL.toLowerCase(),
  instituteId: "all",
  role: "super",
  addedBy: "system",
  addedAt: "2026-01-01T00:00:00.000Z",
};

export function defaultAdmins(): AdminAccount[] {
  return [{ ...SUPER_ADMIN_ACCOUNT }];
}

function parseAdminList(raw: string | null): AdminAccount[] {
  if (!raw) return defaultAdmins();
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return defaultAdmins();
    const superAdmin = SUPER_ADMIN_ACCOUNT;
    const others = (data as AdminAccount[]).filter(
      (a) => a && typeof a.email === "string" && !isAdminEmail(a.email),
    );
    return [superAdmin, ...others];
  } catch {
    return defaultAdmins();
  }
}

export function loadAdmins(raw: string | null): AdminAccount[] {
  return parseAdminList(raw);
}

export function adminProfile(
  email: string | null | undefined,
  accounts: AdminAccount[],
): AdminAccount | null {
  if (!email) return null;
  const key = email.trim().toLowerCase();
  return accounts.find((a) => a.email.toLowerCase() === key) ?? null;
}

/** True when the email can manage at least one institute. */
export function isAdmin(email: string | null | undefined, accounts: AdminAccount[]): boolean {
  return adminProfile(email, accounts) !== null;
}

export function canManageInstitute(
  email: string | null | undefined,
  instituteId: string,
  accounts: AdminAccount[],
): boolean {
  const profile = adminProfile(email, accounts);
  if (!profile) return false;
  return profile.instituteId === "all" || profile.instituteId === instituteId;
}

export type AddAdminResult = { ok: true; accounts: AdminAccount[] } | { ok: false; error: string };

export function addInstituteAdmin(
  accounts: AdminAccount[],
  email: string,
  instituteId: string,
  addedBy: string,
): AddAdminResult {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized))
    return { ok: false, error: "Valid email daw" };
  if (isAdminEmail(normalized)) return { ok: false, error: "Super admin already exists" };
  if (accounts.some((a) => a.email.toLowerCase() === normalized)) {
    return { ok: false, error: "Ei email already admin" };
  }
  const count = accounts.filter((a) => a.instituteId === instituteId).length;
  if (count >= MAX_ADMINS_PER_INSTITUTE) {
    return { ok: false, error: `Per institute max ${MAX_ADMINS_PER_INSTITUTE} admin` };
  }
  return {
    ok: true,
    accounts: [
      ...accounts,
      {
        email: normalized,
        instituteId,
        role: "institute",
        addedBy,
        addedAt: new Date().toISOString(),
      },
    ],
  };
}

export function removeInstituteAdmin(accounts: AdminAccount[], email: string): AdminAccount[] {
  return accounts.filter(
    (a) => a.instituteId === "all" || a.email.toLowerCase() !== email.trim().toLowerCase(),
  );
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
export function upsertLocation(
  store: LocationStore,
  instituteId: string,
  loc: CampusLocation,
): LocationStore {
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

export function deleteLocation(
  store: LocationStore,
  instituteId: string,
  locationId: string,
): LocationStore {
  return { ...store, [instituteId]: (store[instituteId] ?? []).filter((l) => l.id !== locationId) };
}
