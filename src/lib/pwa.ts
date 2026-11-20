/** Registers the offline service worker in production builds only. */
export function registerServiceWorker(): void {
  if (typeof window === "undefined" || typeof navigator === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  if (!import.meta.env.PROD) return;

  const register = () => {
    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline support is best-effort; the app still works online.
    });
  };

  if (document.readyState === "complete") register();
  else window.addEventListener("load", register, { once: true });
}
