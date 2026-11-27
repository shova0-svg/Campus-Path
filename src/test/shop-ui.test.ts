import { describe, expect, it } from "vitest";
import fs from "node:fs";

describe("basic shop structure", () => {
  const home = fs.readFileSync("src/routes/shop.index.tsx", "utf8");
  const add = fs.readFileSync("src/routes/shop.new.tsx", "utf8");
  const detail = fs.readFileSync("src/routes/shop.$productId.tsx", "utf8");

  it("has no seller-profile gate and no My Shop segment", () => {
    expect(home).not.toContain("useShopProfile");
    expect(home).not.toContain("/shop/my");
    expect(add).not.toContain("ShopAccessGate");
    expect(add).not.toContain("useShopProfile");
  });

  it("stores contact details on the product itself", () => {
    expect(add).toContain("contactPhone");
    expect(add).toContain("contactWhatsapp");
    expect(detail).toContain("product.contactPhone");
    expect(detail).toContain("product.contactWhatsapp");
  });

  it("keeps browsing and detail free of seller management UI", () => {
    expect(detail).not.toContain("setProductStatus");
    expect(detail).not.toContain("deleteProduct");
    expect(detail).not.toContain("sellerProfile");
    expect(fs.existsSync("src/routes/shop.my.tsx")).toBe(false);
  });
});
