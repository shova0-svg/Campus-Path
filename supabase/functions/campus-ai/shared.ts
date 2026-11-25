export const ROUTE_WHITELIST = [
  "/",
  "/student",
  "/updates",
  "/cr",
  "/right-now",
  "/teachers",
  "/shop",
  "/shop/my",
  "/shop/requests",
  "/shop/wishlist",
  "/shop/inbox",
  "/settings",
];

/** Only allow app routes or a product link — never an arbitrary URL. */
export function safeDeepLink(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const link = value.trim();
  if (ROUTE_WHITELIST.includes(link)) return link;
  if (/^\/shop\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(link))
    return link;
  return undefined;
}
