import { useEffect, useState } from "react";
import { ClipboardCheck, House, MessageSquare, ShieldCheck, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

export type BottomTabId = "home" | "feedback" | "cr" | "profile" | "admin";

interface Tab {
  id: BottomTabId;
  label: string;
  ariaLabel: string;
  icon: typeof House;
}

const TABS: Tab[] = [
  { id: "home", label: "Home", ariaLabel: "Home", icon: House },
  { id: "feedback", label: "Feedback", ariaLabel: "Send feedback", icon: MessageSquare },
  { id: "cr", label: "CR", ariaLabel: "CR section", icon: ClipboardCheck },
  { id: "profile", label: "Profile", ariaLabel: "Account", icon: UserRound },
  { id: "admin", label: "Admin", ariaLabel: "Open admin panel", icon: ShieldCheck },
];

interface Props {
  active: BottomTabId;
  isAdmin: boolean;
  isCr: boolean;
  onSelect: (id: BottomTabId) => void;
}

/** Hide the bar while an on-screen keyboard shrinks the visual viewport. */
function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const update = () => setOpen(viewport.height < window.innerHeight - 120);
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, []);
  return open;
}

export function BottomTabBar({ active, isAdmin, isCr, onSelect }: Props) {
  const keyboardOpen = useKeyboardOpen();
  if (keyboardOpen) return null;

  const showCr = isCr || isAdmin;
  const tabs = TABS.filter((t) => t.id !== "admin" || isAdmin).filter(
    (t) => t.id !== "cr" || showCr,
  );

  return (
    <nav
      aria-label="Bottom navigation"
      className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-1/2 z-40 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-[1.75rem] border border-border bg-card/90 p-1.5 shadow-[var(--shadow-float)] backdrop-blur-xl"
    >
      <ul className="flex items-stretch justify-around gap-0.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const selected = active === tab.id;
          return (
            <li key={tab.id} className="min-w-0 flex-1">
              <button
                type="button"
                aria-label={tab.ariaLabel}
                aria-current={selected ? "page" : undefined}
                onClick={() => onSelect(tab.id)}
                className={cn(
                  "flex w-full min-w-0 flex-col items-center gap-0.5 rounded-2xl px-1 py-2 text-[10px] font-semibold transition-colors",
                  selected
                    ? "bg-emerald-soft text-emerald"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden="true" />
                <span className="w-full truncate text-center">{tab.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
