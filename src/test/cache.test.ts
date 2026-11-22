import { beforeEach, describe, expect, it, vi } from "vitest";
import { createResource } from "@/lib/cache";

// jsdom in this repo has no localStorage backend; use a minimal in-memory one.
const disk = new Map<string, string>();
if (!window.localStorage) {
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (k: string) => disk.get(k) ?? null,
      setItem: (k: string, v: string) => void disk.set(k, v),
      removeItem: (k: string) => void disk.delete(k),
      clear: () => disk.clear(),
      key: (i: number) => [...disk.keys()][i] ?? null,
      get length() {
        return disk.size;
      },
    },
  });
}

describe("stale-while-revalidate cache", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("serves the code seed when cache and network are empty", async () => {
    const resource = createResource<string[]>({
      key: "test-seed",
      seed: () => ["seed"],
      fetcher: async () => null,
    });
    expect(resource.get()).toEqual(["seed"]);
    await resource.refresh();
    expect(resource.get()).toEqual(["seed"]);
  });

  it("renders from local cache first then revalidates and notifies", async () => {
    window.localStorage.setItem("test-swr", JSON.stringify(["cached"]));
    let remote: string[] | null = ["remote"];
    const fetcher = vi.fn(async () => remote);
    const resource = createResource<string[]>({
      key: "test-swr",
      event: "sohoj:test-changed",
      seed: () => ["seed"],
      fetcher,
    });
    const listener = vi.fn();
    resource.subscribe(listener);

    expect(resource.get()).toEqual(["cached"]);
    await resource.refresh();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(resource.get()).toEqual(["remote"]);
    expect(listener).toHaveBeenCalledWith(["remote"]);
    expect(JSON.parse(window.localStorage.getItem("test-swr") ?? "null")).toEqual(["remote"]);

    remote = ["remote-2"];
    await resource.refresh();
    expect(resource.get()).toEqual(["remote-2"]);
  });

  it("does not hit the network when offline and keeps last-known data", async () => {
    const fetcher = vi.fn(async () => ["remote"]);
    const resource = createResource<string[]>({
      key: "test-offline",
      seed: () => ["seed"],
      fetcher,
    });
    resource.set(["local-edit"]);
    const original = navigator.onLine;
    Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
    try {
      await resource.refresh();
      expect(fetcher).not.toHaveBeenCalled();
      expect(resource.get()).toEqual(["local-edit"]);
    } finally {
      Object.defineProperty(navigator, "onLine", { configurable: true, value: original });
    }
  });

  it("keeps last-known data when the network throws", async () => {
    const resource = createResource<string[]>({
      key: "test-error",
      seed: () => ["seed"],
      fetcher: async () => {
        throw new Error("offline");
      },
    });
    resource.set(["kept"]);
    await resource.refresh();
    expect(resource.get()).toEqual(["kept"]);
  });
});
