import { beforeEach, describe, expect, it } from "vitest";
import {
  LAST_PUSH_KEY,
  SOUND_PATH,
  notePushReceived,
  setSoundEnabled,
  soundEnabled,
} from "@/lib/notify-sound";

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

describe("in-app notification sound", () => {
  beforeEach(() => window.localStorage.clear());

  it("is on by default and remembers the toggle", () => {
    expect(soundEnabled()).toBe(true);
    setSoundEnabled(false);
    expect(soundEnabled()).toBe(false);
    setSoundEnabled(true);
    expect(soundEnabled()).toBe(true);
  });

  it("records the last push time", () => {
    notePushReceived();
    expect(new Date(window.localStorage.getItem(LAST_PUSH_KEY) ?? "").getTime()).toBeGreaterThan(0);
    expect(SOUND_PATH).toBe("/sounds/notify.mp3");
  });
});
