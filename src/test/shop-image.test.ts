import { describe, expect, it } from "vitest";
import { shopImageUrl } from "@/lib/shop-image";

const FULL = "https://example.supabase.co/storage/v1/object/public/shop-images/user/item.webp";

describe("shopImageUrl", () => {
  it("builds a public URL from a storage path", () => {
    const url = shopImageUrl("user/item.webp");
    expect(url).toContain("/storage/v1/object/public/shop-images/user/item.webp");
  });

  it("handles leading slash and legacy bucket prefix without doubling", () => {
    expect(shopImageUrl("/shop-images/user/item.webp")).toContain(
      "/storage/v1/object/public/shop-images/user/item.webp",
    );
    expect(shopImageUrl("/user/item.webp")).not.toContain("shop-images/shop-images");
  });

  it("returns legacy full URLs unchanged", () => {
    expect(shopImageUrl(FULL)).toBe(FULL);
  });

  it("returns empty string for empty, null and whitespace", () => {
    expect(shopImageUrl("")).toBe("");
    expect(shopImageUrl(null)).toBe("");
    expect(shopImageUrl(undefined)).toBe("");
    expect(shopImageUrl("   ")).toBe("");
  });
});
