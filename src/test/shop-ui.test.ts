import { describe, expect, it } from "vitest";
import fs from "node:fs";

describe("shop home access", () => {
  const home = fs.readFileSync("src/routes/shop.index.tsx", "utf8");
  const sell = fs.readFileSync("src/routes/shop.new.tsx", "utf8");

  it("lets signed-in users browse without a seller profile", () => {
    expect(home).not.toContain("return <ShopAccessGate");
    expect(home).toContain('to="/shop/new"');
  });

  it("keeps the seller gate on the add-product route", () => {
    expect(sell).toContain("Set up your shop first");
  });
});
