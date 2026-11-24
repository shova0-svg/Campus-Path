import { useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useAdminRole } from "@/hooks/use-admin-role";
import { useCrRole } from "@/hooks/use-cr-role";
import { openFeedback } from "@/lib/feedback";
import { BottomTabBar, type BottomTabId } from "./BottomTabBar";

/** Home listens for this to open its admin drawer from any screen. */
export const OPEN_ADMIN_EVENT = "sohoj:open-admin";

/** Route-aware wrapper: one tab bar for the whole signed-in app. */
export function GlobalTabBar() {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const adminRole = useAdminRole();
  const crRole = useCrRole();
  // Role data comes from local caches; keep the first render identical to SSR.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isAdmin = mounted && adminRole.isAdmin;
  const isCr = mounted && crRole.isCr;

  if (!user || pathname === "/auth" || pathname === "/reset-password") return null;

  const active: BottomTabId = pathname.startsWith("/shop")
    ? "shop"
    : pathname === "/cr"
      ? "cr"
      : pathname === "/student"
        ? "profile"
        : "home";

  async function select(id: BottomTabId) {
    switch (id) {
      case "home":
        await navigate({ to: "/" });
        window.scrollTo({ top: 0, behavior: "smooth" });
        break;
      case "feedback":
        openFeedback({ page: pathname });
        break;
      case "shop":
        await navigate({ to: "/shop" });
        window.scrollTo({ top: 0 });
        break;
      case "cr":
        await navigate({ to: "/cr" });
        window.scrollTo({ top: 0 });
        break;
      case "profile":
        await navigate({ to: "/student" });
        window.scrollTo({ top: 0 });
        break;
      case "admin":
        if (pathname !== "/") await navigate({ to: "/" });
        // Wait for the home route to mount before asking it to open the panel.
        window.setTimeout(() => window.dispatchEvent(new Event(OPEN_ADMIN_EVENT)), 0);
        break;
    }
  }

  return <BottomTabBar active={active} isAdmin={isAdmin} isCr={isCr} onSelect={select} />;
}
