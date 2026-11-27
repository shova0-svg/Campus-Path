import { describe, expect, it } from "vitest";
import { safeGet, safeRemove, safeSet } from "@/lib/storage";

describe("safe storage", () => {
  it("never throws when localStorage is blocked", () => {
    const originals = {
      getItem: Storage.prototype.getItem,
      setItem: Storage.prototype.setItem,
      removeItem: Storage.prototype.removeItem,
    };
    try {
      Storage.prototype.getItem = () => {
        throw new Error("blocked");
      };
      Storage.prototype.setItem = () => {
        throw new Error("blocked");
      };
      Storage.prototype.removeItem = () => {
        throw new Error("blocked");
      };
      expect(safeGet("x")).toBeNull();
      expect(() => safeSet("x", "1")).not.toThrow();
      expect(() => safeRemove("x")).not.toThrow();
    } finally {
      Storage.prototype.getItem = originals.getItem;
      Storage.prototype.setItem = originals.setItem;
      Storage.prototype.removeItem = originals.removeItem;
    }
  });
});
