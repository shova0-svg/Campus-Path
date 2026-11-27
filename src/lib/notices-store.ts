import { safeGet, safeSet } from "@/lib/storage";
import { mergeNotices, type Notice, type NoticeSource } from "@/lib/notices";

export const NOTICES_KEY = "sohoj-notices-v1";
export const NOTICE_SOURCES_KEY = "sohoj-notice-sources-v1";
export const NOTICES_CHANGED = "sohoj:notices-changed";

export const DEFAULT_SOURCES: NoticeSource[] = [
  {
    instituteId: "rpi",
    label: "Rajshahi Govt. Polytechnic Institute",
    url: "https://rajshahi.polytech.gov.bd/pages/notices",
  },
];

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = safeGet(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    safeSet(key, JSON.stringify(value));
    window.dispatchEvent(new Event(NOTICES_CHANGED));
  } catch {
    /* storage full or blocked */
  }
}

export function loadNotices(): Notice[] {
  return read<Notice[]>(NOTICES_KEY, []);
}

export function saveNotices(notices: Notice[]): void {
  write(NOTICES_KEY, notices);
}

export function addNotices(incoming: Notice[]): Notice[] {
  const next = mergeNotices(loadNotices(), incoming);
  saveNotices(next);
  return next;
}

export function loadSources(): NoticeSource[] {
  const saved = read<NoticeSource[]>(NOTICE_SOURCES_KEY, DEFAULT_SOURCES);
  return saved.length > 0 ? saved : DEFAULT_SOURCES;
}

export function saveSources(sources: NoticeSource[]): void {
  write(NOTICE_SOURCES_KEY, sources);
}

/** Fetches through our server proxy (the source site has no CORS headers). */
export async function fetchNotices(source: NoticeSource): Promise<Notice[]> {
  if (typeof window === "undefined") return [];
  const params = new URLSearchParams({ url: source.url, instituteId: source.instituteId });
  const response = await fetch(`/api/notices?${params}`);
  if (!response.ok) throw new Error(`Notices fetch failed (${response.status})`);
  const data = (await response.json()) as { notices?: Notice[] };
  return data.notices ?? [];
}
