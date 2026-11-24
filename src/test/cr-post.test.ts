import { describe, expect, it, vi } from "vitest";
import { postErrorMessage, saveThenNotify, withNetworkRetry } from "@/lib/class-updates";

describe("class update post errors", () => {
  it("maps RLS rejection to a clear not-a-CR message", () => {
    expect(
      postErrorMessage({
        code: "42501",
        message: 'new row violates row-level security policy for table "class_updates"',
      }),
    ).toContain("not a CR");
  });

  it("maps session, network, input and server errors", () => {
    expect(postErrorMessage(new Error("JWT expired"))).toContain("Session expired");
    expect(postErrorMessage(new Error("Failed to fetch"))).toContain("Network problem");
    expect(postErrorMessage({ code: "23514", message: "check constraint" })).toContain(
      "Invalid input",
    );
    expect(postErrorMessage({ code: "500", message: "internal server error" })).toContain(
      "Server error",
    );
  });

  it("retries once on a network error but never on a 4xx", async () => {
    const network = vi
      .fn()
      .mockRejectedValueOnce(new Error("Failed to fetch"))
      .mockResolvedValue("ok");
    expect(await withNetworkRetry(network)).toBe("ok");
    expect(network).toHaveBeenCalledTimes(2);

    const rejected = vi.fn().mockRejectedValue({ code: "42501", message: "denied" });
    await expect(withNetworkRetry(rejected)).rejects.toMatchObject({ code: "42501" });
    expect(rejected).toHaveBeenCalledTimes(1);
  });

  it("keeps the saved post even when the push fails", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const save = vi.fn(async () => ({ id: "post-1", title: "Digital Electronics CT" }));
    const notify = vi.fn(() => {
      throw new Error("push failed");
    });
    const result = await saveThenNotify(save, notify);
    expect(result.title).toBe("Digital Electronics CT");
    expect(save).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});
