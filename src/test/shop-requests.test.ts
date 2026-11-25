import { describe, expect, it } from "vitest";
import { allowedTransition, requestStatusLabel, validateRequestInput } from "@/lib/shop-requests";

describe("purchase request helpers", () => {
  it("allows only DB-matching transitions", () => {
    expect(allowedTransition("pending", "cancelled", "buyer")).toBe(true);
    expect(allowedTransition("pending", "accepted", "seller")).toBe(true);
    expect(allowedTransition("accepted", "completed", "seller")).toBe(true);
    expect(allowedTransition("pending", "completed", "seller")).toBe(false);
    expect(allowedTransition("accepted", "cancelled", "buyer")).toBe(false);
    expect(allowedTransition("pending", "completed", "admin")).toBe(true);
  });

  it("validates quantity against stock and message length", () => {
    expect(validateRequestInput(2, 5, "hi")).toEqual({});
    const zero = validateRequestInput(0, 5, "");
    const tooMany = validateRequestInput(6, 5, "");
    const long = validateRequestInput(1, 5, "x".repeat(501));
    expect(zero["quantity"]).toContain("Quantity");
    expect(tooMany["quantity"]).toContain("stock");
    expect(long["message"]).toContain("500");
  });

  it("has bilingual status labels", () => {
    expect(requestStatusLabel("accepted")).toContain("Accepted");
    expect(requestStatusLabel("pending")).toContain("অপেক্ষমাণ");
  });
});
