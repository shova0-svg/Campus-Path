import { describe, expect, it } from "vitest";
import {
  MAX_ACTIVE_LISTINGS,
  SAFETY_NOTE,
  canRelist,
  conditionLabel,
  filterProducts,
  formatPrice,
  isValidPhone,
  sortProducts,
  statusForQuantity,
  timeAgo,
  validateProduct,
  validateShopProfile,
  whatsappLink,
  type ProductInput,
  type ShopProduct,
} from "@/lib/shop";

const input = (patch: Partial<ProductInput> = {}): ProductInput => ({
  title: "Engineer's steel ruler",
  description: "Good condition",
  category: "drawing_tools",
  condition: "used",
  price: "450",
  isNegotiable: true,
  images: ["rpi/u1/a.webp"],
  quantity: 1,
  ...patch,
});

const product = (patch: Partial<ShopProduct> = {}): ShopProduct => ({
  id: "p1",
  sellerId: "u1",
  instituteId: "rpi",
  title: "Old book",
  description: "Bangla medium",
  category: "old_books",
  condition: "used",
  price: 100,
  isNegotiable: false,
  images: ["a.webp"],
  quantity: 1,
  views: 0,
  status: "available",
  createdAt: "2026-11-23T00:00:00Z",
  updatedAt: "2026-11-23T00:00:00Z",
  ...patch,
});

describe("shop validation", () => {
  it("accepts a valid listing", () => {
    expect(validateProduct(input())).toEqual({});
  });

  it("rejects missing category, short title, bad price and no images", () => {
    const errors = validateProduct(input({ title: "ab", category: "", price: "-1", images: [] }));
    expect(Object.keys(errors).sort()).toEqual(["category", "images", "price", "title"]);
  });

  it("validates phone and WhatsApp numbers", () => {
    expect(isValidPhone(" 01712-345678 ")).toBe(true);
    expect(isValidPhone("abc")).toBe(false);
  });

  it("has the expected limits and safety note", () => {
    expect(MAX_ACTIVE_LISTINGS).toBe(10);
    expect(SAFETY_NOTE).toContain("pay in person");
    expect(conditionLabel("like_new")).toBe("Like new / প্রায় নতুন");
  });
});

describe("shop feed helpers", () => {
  const list = [
    product({ id: "cheap", price: 50, category: "old_books", createdAt: "2026-11-20T00:00:00Z" }),
    product({
      id: "pricey",
      price: 500,
      category: "electronics",
      description: "Mobile phone charger",
      createdAt: "2026-11-22T00:00:00Z",
    }),
    product({ id: "sold", status: "sold", price: 10 }),
    product({ id: "reserved", status: "reserved", price: 200, condition: "new" }),
  ];

  it("hides sold items and filters by category, price and query", () => {
    expect(filterProducts(list, {}).map((p) => p.id)).toEqual(["cheap", "pricey", "reserved"]);
    expect(filterProducts(list, { category: "electronics" }).map((p) => p.id)).toEqual(["pricey"]);
    expect(filterProducts(list, { minPrice: 100, maxPrice: 300 }).map((p) => p.id)).toEqual([
      "reserved",
    ]);
    expect(filterProducts(list, { query: "charger" }).map((p) => p.id)).toEqual(["pricey"]);
  });

  it("sorts newest, low-high and high-low", () => {
    const active = filterProducts(list, {});
    expect(sortProducts(active).map((p) => p.id)).toEqual(["reserved", "pricey", "cheap"]);
    expect(sortProducts(active, "price_asc").map((p) => p.id)).toEqual([
      "cheap",
      "reserved",
      "pricey",
    ]);
    expect(sortProducts(active, "price_desc").map((p) => p.id)).toEqual([
      "pricey",
      "reserved",
      "cheap",
    ]);
  });

  it("formats price and builds a WhatsApp link", () => {
    expect(formatPrice(1250)).toBe("৳1,250");
    expect(whatsappLink("01712-345678")).toContain("wa.me/01712345678");
  });

  it("renders relative time with an injected clock", () => {
    const now = new Date("2026-11-24T00:00:00Z");
    expect(timeAgo("2026-11-23T23:30:00Z", now)).toBe("এখনই / Just now");
    expect(timeAgo("2026-11-22T23:30:00Z", now)).toBe("কাল / Yesterday");
  });
});

describe("shop profile validation", () => {
  const base = { shopName: "Campus Store", bio: "", phone: "01712345678", department: "CST" };

  it("accepts a valid seller profile", () => {
    expect(validateShopProfile(base)).toEqual({});
  });

  it("rejects short name, bad phone and missing department", () => {
    const errors = validateShopProfile({ ...base, shopName: "x", phone: "abc", department: "" });
    expect(Object.keys(errors).sort()).toEqual(["department", "phone", "shopName"]);
  });
});

describe("seller dashboard rules", () => {
  it("marks zero stock as sold", () => {
    expect(statusForQuantity(0, "available")).toBe("sold");
    expect(statusForQuantity(0, "reserved")).toBe("sold");
    expect(statusForQuantity(2, "available")).toBe("available");
  });

  it("allows relist only with stock", () => {
    expect(canRelist(product({ status: "sold", quantity: 1 }))).toBe(true);
    expect(canRelist(product({ status: "sold", quantity: 0 }))).toBe(false);
    expect(canRelist(product({ status: "available", quantity: 1 }))).toBe(false);
  });
});
