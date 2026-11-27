import { describe, expect, it } from "vitest";
import fs from "node:fs";

describe("shop home access", () => {
  const home = fs.readFileSync("src/routes/shop.index.tsx", "utf8");
  const sell = fs.readFileSync("src/routes/shop.new.tsx", "utf8");

  it("lets signed-in users browse without a seller profile", () => {
    expect(home).not.toContain("return <ShopAccessGate");
    expect(home).toContain('to="/shop/new"');
  });

  it("lets a seller set up inline on the add-product route", () => {
    expect(sell).toContain("ShopAccessGate");
    expect(sell).not.toContain("Set up your shop first");
  });

  it("lets a seller set up inline from My Shop", () => {
    const mine = fs.readFileSync("src/routes/shop.my.tsx", "utf8");
    expect(mine).toContain("ShopAccessGate");
    expect(mine).not.toContain("Set up your shop first");
  });

  it("surfaces product errors and offers full edit in My Shop", () => {
    const mine = fs.readFileSync("src/routes/shop.my.tsx", "utf8");
    expect(mine).toContain("void deleteProduct(id)");
    expect(mine).toContain("productError");
    expect(mine).toContain("search={{ edit: p.id }}");
    expect(mine).toContain("statusLabel(p.status)");
  });

  it("separates profile errors from a missing profile", () => {
    const hook = fs.readFileSync("src/hooks/use-shop-profile.ts", "utf8");
    expect(hook).toContain("setError({");
    expect(hook).toContain("setChecked(true)");
    expect(fs.readFileSync("src/routes/shop.my.tsx", "utf8")).toContain("ShopProfileErrorState");
  });
});
