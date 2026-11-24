import { useEffect } from "react";
import { installSoundUnlock, notePushReceived, playNotifySound } from "@/lib/notify-sound";

/** Plays the custom sound only while the app is open (SW → client message). */
export function PushSoundHost() {
  useEffect(() => {
    const removeUnlock = installSoundUnlock();
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type !== "PUSH_RECEIVED") return;
      playNotifySound();
      notePushReceived();
    };
    navigator.serviceWorker?.addEventListener("message", onMessage);
    return () => {
      removeUnlock();
      navigator.serviceWorker?.removeEventListener("message", onMessage);
    };
  }, []);
  return null;
}
