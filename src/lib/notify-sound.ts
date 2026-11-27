import { safeGet, safeSet } from "@/lib/storage";
/** In-app notification sound (background web push sound cannot be customized). */

export const SOUND_PATH = "/sounds/notify.mp3";
const SOUND_KEY = "sohoj-rasta-notify-sound";
export const LAST_PUSH_KEY = "sohoj-rasta-last-push";

export function soundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return safeGet(SOUND_KEY) !== "0";
  } catch {
    return true;
  }
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    safeSet(SOUND_KEY, enabled ? "1" : "0");
  } catch {
    /* storage blocked */
  }
}

let unlocked = false;
let audio: HTMLAudioElement | null = null;

/** Browsers block audio before a gesture — play once, silently, on first tap/key. */
export function unlockNotifySound(): void {
  if (unlocked || typeof window === "undefined") return;
  try {
    const element = new Audio(SOUND_PATH);
    element.volume = 0;
    element.preload = "auto";
    void element.play().then(
      () => {
        element.pause();
        element.currentTime = 0;
        element.volume = 1;
        audio = element;
        unlocked = true;
      },
      () => {
        /* still blocked — a later tap will try again */
      },
    );
  } catch {
    /* fail silently */
  }
}

export function installSoundUnlock(): () => void {
  if (typeof window === "undefined") return () => {};
  const onGesture = () => unlockNotifySound();
  window.addEventListener("pointerdown", onGesture, { once: true });
  window.addEventListener("keydown", onGesture, { once: true });
  return () => {
    window.removeEventListener("pointerdown", onGesture);
    window.removeEventListener("keydown", onGesture);
  };
}

export function playNotifySound(): void {
  if (!soundEnabled() || typeof window === "undefined") return;
  try {
    const element = audio ?? new Audio(SOUND_PATH);
    audio = element;
    element.currentTime = 0;
    element.volume = 1;
    void element.play().catch(() => {
      /* autoplay still blocked — fail silently */
    });
  } catch {
    /* fail silently */
  }
}

export function notePushReceived(): void {
  if (typeof window === "undefined") return;
  try {
    safeSet(LAST_PUSH_KEY, new Date().toISOString());
  } catch {
    /* storage blocked */
  }
}
