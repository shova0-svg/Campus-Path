import { describe, expect, it } from "vitest";
import fs from "node:fs";
import {
  isValidBdPhone,
  MAX_IMAGES,
  statusForQuantity,
  validateProduct,
  validateShopProfile,
} from "@/lib/shop";

const input = {
  title: "Ruler",
  description: "Good",
  category: "components_tools" as const,
  condition: "used" as const,
  price: "100",
  isNegotiable: false,
  images: ["a.webp"],
  quantity: 1,
};

describe("basic shop rules", () => {
  it("maps zero stock to Sold", () => {
    expect(statusForQuantity(0, "active")).toBe("sold");
    expect(statusForQuantity(0, "reserved")).toBe("sold");
    expect(statusForQuantity(2, "active")).toBe("active");
  });

  it("validates BD phones, titles, integer BDT price and 5 images", () => {
    const seller = { shopName: "Shop", bio: "", phone: "01712345678", department: "CST" };
    expect(isValidBdPhone("+8801712345678")).toBe(true);
    expect(isValidBdPhone("12345")).toBe(false);
    expect(validateShopProfile({ ...seller, phone: "abc" })["phone"]).toBeTruthy();
    expect(validateProduct({ ...input, title: "" })["title"]).toBeTruthy();
    expect(validateProduct({ ...input, price: "1.5" })["price"]).toBeTruthy();
    expect(
      validateProduct({ ...input, images: Array.from({ length: MAX_IMAGES }, (_, i) => `${i}`) }),
    ).toEqual({});
  });

  it("has loading, error, empty and pagination states in browse", () => {
    const home = fs.readFileSync("src/routes/shop.index.tsx", "utf8");
    expect(home).toContain("animate-pulse");
    expect(home).toContain("loadError");
    expect(home).toContain("No items found");
    expect(home).toContain("20,");
  });

  it("keeps no profile setup or seller dashboard files", () => {
    expect(fs.existsSync("src/hooks/use-shop-profile.ts")).toBe(false);
    expect(fs.existsSync("src/components/sohoj/shop/ShopAccessGate.tsx")).toBe(false);
    expect(fs.existsSync("src/routes/shop.my.tsx")).toBe(false);
    expect(fs.existsSync("src/routes/shop.seller.$sellerId.tsx")).toBe(false);
  });
});
