/**
 * Stale-while-revalidate cache for campus data.
 * - Renders instantly from memory/localStorage cache.
 * - Refreshes from Supabase in the background when online.
 * - Serves the last-known cache when offline (no network call).
 * - Falls back to code seeds when both cache and network are empty.
 */

type Listener<T> = (value: T) => void;

const memory = new Map<string, unknown>();
const listeners = new Map<string, Set<Listener<unknown>>>();

function readDisk<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeDisk<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked */
  }
}

export interface SWROptions<T> {
  /** localStorage key for the cached snapshot. */
  key: string;
  /** window event dispatched after a change (legacy components listen to these). */
  event?: string;
  /** Code seed used when neither cache nor network has data. */
  seed: () => T;
  /** Supabase fetcher; return null/empty to keep the current value. */
  fetcher: () => Promise<T | null>;
}

export interface Resource<T> {
  get(): T;
  subscribe(listener: Listener<T>): () => void;
  refresh(): Promise<void>;
  /** Local write (admin edits): updates cache immediately, then revalidates. */
  set(value: T): void;
  /** Clear memory + disk (used in tests). */
  reset(): void;
}

export function createResource<T>(options: SWROptions<T>): Resource<T> {
  const { key, event, seed, fetcher } = options;

  function get(): T {
    if (memory.has(key)) return memory.get(key) as T;
    const cached = readDisk<T>(key);
    const value = cached ?? seed();
    memory.set(key, value);
    return value;
  }

  function notify(value: T): void {
    listeners.get(key)?.forEach((fn) => fn(value));
    if (event && typeof window !== "undefined") {
      window.dispatchEvent(new Event(event));
    }
  }

  function set(value: T): void {
    memory.set(key, value);
    writeDisk(key, value);
    notify(value);
  }

  function subscribe(listener: Listener<T>): () => void {
    let set_ = listeners.get(key);
    if (!set_) {
      set_ = new Set();
      listeners.set(key, set_);
    }
    set_.add(listener as Listener<unknown>);
    return () => set_?.delete(listener as Listener<unknown>);
  }

  async function refresh(): Promise<void> {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    try {
      const next = await fetcher();
      if (next != null) {
        memory.set(key, next);
        writeDisk(key, next);
        notify(next);
      }
    } catch {
      /* keep last-known cache */
    }
  }

  function reset(): void {
    memory.delete(key);
    if (typeof window !== "undefined") window.localStorage.removeItem(key);
  }

  return { get, subscribe, refresh, set, reset };
}
