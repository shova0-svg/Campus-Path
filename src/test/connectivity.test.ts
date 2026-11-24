import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { probeReachable } from "@/hooks/use-connectivity";
import { ordinal } from "@/lib/campus-data";

const originalOnLine = Object.getOwnPropertyDescriptor(navigator, "onLine");

function setOnLine(value: boolean) {
  Object.defineProperty(navigator, "onLine", { configurable: true, value });
}

describe("connectivity probe", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "public-test-key");
    setOnLine(true);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    if (originalOnLine) Object.defineProperty(navigator, "onLine", originalOnLine);
  });

  it("uses the real request result, not just navigator.onLine", async () => {
    const ok = vi.fn().mockResolvedValue({ ok: true });
    expect(await probeReachable(ok as unknown as typeof fetch)).toBe(true);
    const [url, init] = ok.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/rest/v1/institutes?select=id&limit=1");
    expect(init.cache).toBe("no-store");
    const bad = vi.fn().mockResolvedValue({ ok: false });
    expect(await probeReachable(bad as unknown as typeof fetch)).toBe(false);
  });

  it("treats a failed/aborted request as offline", async () => {
    const fail = vi.fn().mockRejectedValue(new Error("network down"));
    expect(await probeReachable(fail as unknown as typeof fetch)).toBe(false);
  });

  it("returns false immediately when the browser says offline", async () => {
    setOnLine(false);
    const unused = vi.fn();
    expect(await probeReachable(unused as unknown as typeof fetch)).toBe(false);
    expect(unused).not.toHaveBeenCalled();
  });
});

describe("semester ordinals", () => {
  it("formats student-friendly ordinals", () => {
    expect([1, 2, 3, 4, 5, 6, 11, 21, 23].map(ordinal)).toEqual([
      "1st",
      "2nd",
      "3rd",
      "4th",
      "5th",
      "6th",
      "11th",
      "21st",
      "23rd",
    ]);
  });
});
