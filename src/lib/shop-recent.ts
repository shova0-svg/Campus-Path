const KEY = "shop-recently-viewed-v1";

export function recentProductIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const ids = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function rememberProduct(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const next = [id, ...recentProductIds().filter((x) => x !== id)].slice(0, 8);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage blocked */
  }
}
