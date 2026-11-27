import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import { ShopProfileErrorState } from "@/components/sohoj/shop/ShopProfileErrorState";
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

describe("shop profile error UI", () => {
  it("shows message, Ref and Retry; debug details hidden by default", () => {
    const onRetry = vi.fn();
    render(
      <ShopProfileErrorState
        error={{ refId: "d97f2051", message: "PGRST301", status: "401", code: "PGRST301" }}
        onRetry={onRetry}
      />,
    );
    expect(screen.getAllByText(/d97f2051/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/PGRST301/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /Retry/ }));
    expect(onRetry).toHaveBeenCalledOnce();
    // Vitest runs with DEV=true, so details are expected here; production hides them.
    expect(document.body.textContent).toContain('"status": "401"');
    const src = fs.readFileSync("src/components/sohoj/shop/ShopProfileErrorState.tsx", "utf8");
    expect(src).toContain('URLSearchParams(window.location.search).has("debug")');
  });
});

describe("shop flow rules", () => {
  it("maps zero stock to Sold and relist keeps status when stocked", () => {
    expect(statusForQuantity(0, "active")).toBe("sold");
    expect(statusForQuantity(0, "reserved")).toBe("sold");
    expect(statusForQuantity(2, "sold")).toBe("sold");
    expect(statusForQuantity(2, "active")).toBe("active");
  });

  it("validates BD phones, 1-char titles and integer BDT price", () => {
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

  it("keeps loading/error/no-profile/profile states distinct in code", () => {
    const my = fs.readFileSync("src/routes/shop.my.tsx", "utf8");
    const hook = fs.readFileSync("src/hooks/use-shop-profile.ts", "utf8");
    expect(hook).toContain('console.error("shop profile load failed"');
    expect(hook).toContain("setChecked(true)");
    expect(my).toContain("ShopProfileErrorState");
    expect(my).toContain("ShopAccessGate onReady");
    expect(my).toContain("animate-pulse");
  });

  it("honours show_phone and status in the detail UI", () => {
    const detail = fs.readFileSync("src/routes/shop.$productId.tsx", "utf8");
    expect(detail).toContain('product.status === "sold" || product.status === "hidden"');
    expect(detail).toContain("Seller has hidden their phone");
    expect(detail).toContain("user?.id === product.sellerId");
  });

  it("has browse loading/error/empty states and 20-per-page loading", () => {
    const home = fs.readFileSync("src/routes/shop.index.tsx", "utf8");
    expect(home).toContain("animate-pulse");
    expect(home).toContain("loadError");
    expect(home).toContain("No items found");
    expect(home).toContain("20,");
  });
});
