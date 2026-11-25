import { describe, expect, it } from "vitest";
import { ROUTE_WHITELIST, safeDeepLink } from "../../supabase/functions/campus-ai/shared";
import {
  AI_BUSY_MESSAGE,
  parseProviderResponse,
} from "../../supabase/functions/campus-ai/provider";

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

describe("OpenRouter provider wrapper", () => {
  it("parses text and tool calls from a provider response", () => {
    const parsed = parseProviderResponse({
      choices: [
        {
          message: {
            content: "Found it",
            tool_calls: [
              { id: "call_1", function: { name: "search_shop", arguments: '{"query":"book"}' } },
            ],
          },
        },
      ],
    });
    expect(parsed.content).toBe("Found it");
    expect(parsed.toolCalls[0]?.id).toBe("call_1");
    expect(parsed.toolCalls[0]?.name).toBe("search_shop");
    expect(parsed.toolCalls[0]?.args).toEqual({ query: "book" });
  });

  it("has a bilingual busy message", () => {
    expect(AI_BUSY_MESSAGE).toContain("AI is busy");
    expect(AI_BUSY_MESSAGE).toContain("ব্যস্ত");
  });
});
