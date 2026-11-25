import { describe, expect, it } from "vitest";
import { ROUTE_WHITELIST, safeDeepLink } from "../../supabase/functions/campus-ai/shared";
import { AI_BUSY_MESSAGE, parseGeminiResponse } from "../../supabase/functions/campus-ai/provider";

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

describe("Gemini provider wrapper", () => {
  it("parses text and tool calls from a Gemini response", () => {
    const parsed = parseGeminiResponse({
      candidates: [
        {
          content: {
            parts: [
              { text: "Found it" },
              { functionCall: { name: "search_shop", args: { query: "book" } } },
            ],
          },
        },
      ],
    });
    expect(parsed.content).toBe("Found it");
    expect(parsed.toolCalls[0]?.name).toBe("search_shop");
    expect(parsed.toolCalls[0]?.args).toEqual({ query: "book" });
  });

  it("has a bilingual busy message", () => {
    expect(AI_BUSY_MESSAGE).toContain("AI is busy");
    expect(AI_BUSY_MESSAGE).toContain("ব্যস্ত");
  });
});
