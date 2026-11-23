/** Pure notice parsing/validation — shared by the browser and the /api/notices proxy. */

export interface Notice {
  id: string;
  title: string;
  /** Display date as published (Bangla digits converted where possible). */
  date: string;
  /** Absolute URL of the original notice detail page. */
  url: string;
  /** Optional thumbnail from the notice list. */
  image?: string;
  instituteId: string;
  source: "fetched" | "manual";
  fetchedAt: string;
}

export interface NoticeSource {
  instituteId: string;
  label: string;
  url: string;
}

const BN_DIGITS: Record<string, string> = {
  "০": "0",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9",
};

export function toAsciiDigits(value: string): string {
  return value.replace(/[০-৯]/g, (d) => BN_DIGITS[d] ?? d);
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)));
}

function stripTags(value: string): string {
  return decodeEntities(value.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function absoluteUrl(href: string, base: string): string {
  try {
    return new URL(href, base).href;
  } catch {
    return "";
  }
}

/** Normalizes dd-mm-yyyy / dd/mm/yyyy to yyyy-mm-dd; keeps other strings as-is. */
export function normalizeDate(value: string): string {
  const ascii = toAsciiDigits(stripTags(value));
  const parts = ascii.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (!parts) return ascii;
  return `${parts[3]}-${parts[2]!.padStart(2, "0")}-${parts[1]!.padStart(2, "0")}`;
}

function cell(row: string, column: string): string {
  const match = row.match(
    new RegExp(`<td[^>]*data-column="${column}"[^>]*>([\\s\\S]*?)</td>`, "i"),
  );
  return match?.[1] ?? "";
}

/**
 * Parses the RGPI-style notice table (`#noticeTable`) into notices.
 * Works on raw HTML with no DOM, so it runs in the browser and on the server.
 */
export function parseNoticesHtml(html: string, baseUrl: string, instituteId = "rpi"): Notice[] {
  const rows = html.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi) ?? [];
  const fetchedAt = new Date().toISOString();
  const notices: Notice[] = [];

  for (const row of rows) {
    if (!/data-column="title"/i.test(row)) continue;
    const title = stripTags(cell(row, "title"));
    if (!title) continue;

    const links = [...row.matchAll(/<a[^>]*href="([^"]+)"[^>]*>/gi)].map((m) => m[1] ?? "");
    const detail = links.find((href) => /\/notices\//i.test(href)) ?? links[0] ?? "";
    const url = detail ? absoluteUrl(decodeEntities(detail), baseUrl) : "";
    if (!url) continue;

    const imageHref = cell(row, "image").match(/<img[^>]*src="([^"]+)"/i)?.[1] ?? "";
    const date = normalizeDate(cell(row, "publish_date"));
    const id = url.split("/").filter(Boolean).pop() ?? `${title}-${date}`;

    notices.push({
      id,
      title,
      date,
      url,
      ...(imageHref ? { image: absoluteUrl(decodeEntities(imageHref), baseUrl) } : {}),
      instituteId,
      source: "fetched",
      fetchedAt,
    });
  }
  return notices;
}

export function noticeKey(notice: Pick<Notice, "instituteId" | "id" | "url">): string {
  return `${notice.instituteId}:${notice.id || notice.url}`;
}

export function mergeNotices(existing: Notice[], incoming: Notice[]): Notice[] {
  const byKey = new Map(existing.map((n) => [noticeKey(n), n]));
  for (const n of incoming) byKey.set(noticeKey(n), n);
  return [...byKey.values()].sort((a, b) => b.date.localeCompare(a.date));
}

export function newNotices(existing: Notice[], incoming: Notice[]): Notice[] {
  const known = new Set(existing.map(noticeKey));
  return incoming.filter((n) => !known.has(noticeKey(n)));
}

export interface ManualNoticeInput {
  title: string;
  date: string;
  url: string;
  instituteId: string;
}

/** Returns field → error. Empty object means valid. */
export function validateManualNotice(input: ManualNoticeInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.title.trim()) errors["title"] = "শিরোনাম দিন / Title required";
  if (!input.instituteId.trim()) errors["instituteId"] = "Polytechnic বেছে নিন";
  if (input.url.trim()) {
    try {
      const u = new URL(input.url.trim());
      if (u.protocol !== "http:" && u.protocol !== "https:") errors["url"] = "http(s) link দিন";
    } catch {
      errors["url"] = "সঠিক link দিন / Invalid URL";
    }
  }
  return errors;
}

export function makeManualNotice(input: ManualNoticeInput): Notice {
  const title = input.title.trim();
  return {
    id: `manual-${Date.now()}`,
    title,
    date: normalizeDate(input.date),
    url: input.url.trim(),
    instituteId: input.instituteId,
    source: "manual",
    fetchedAt: new Date().toISOString(),
  };
}

/** Blocks obvious SSRF targets for the server-side fetch proxy. */
export function isSafeNoticeUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  if (u.username || u.password) return false;
  const host = u.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host === "0.0.0.0") return false;
  if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host)) return false;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false;
  if (/^169\.254\./.test(host) || host === "::1") return false;
  return true;
}
