import { describe, expect, it } from "vitest";
import { ROUTE_WHITELIST, safeDeepLink } from "../../supabase/functions/campus-ai/shared";

describe("Campus AI deep-link whitelist", () => {
  it("accepts known app routes and product links", () => {
    for (const route of ROUTE_WHITELIST) expect(safeDeepLink(route)).toBe(route);
    expect(safeDeepLink("/shop/36c16ca1-089c-4d03-baa2-10225e141276")).toContain("/shop/");
  });

  it("rejects injected / external / malformed links", () => {
    expect(safeDeepLink("https://evil.example/steal")).toBeUndefined();
    expect(safeDeepLink("javascript:alert(1)")).toBeUndefined();
    expect(safeDeepLink("/shop/../admin")).toBeUndefined();
    expect(safeDeepLink(42)).toBeUndefined();
  });
});
