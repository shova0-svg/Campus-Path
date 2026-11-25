import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listNotifications, markNotificationRead } from "@/lib/repo/shopRequests";

export const Route = createFileRoute("/shop/inbox")({
  head: () => ({ meta: [{ title: "Notifications — Campus Path" }] }),
  component: NotificationInbox,
});

function NotificationInbox() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listNotifications>>>([]);
  const load = useCallback(async () => setRows(await listNotifications()), []);
  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="bg-desk min-h-dvh px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6">
      <main className="mx-auto w-full max-w-md space-y-4">
        <div className="flex items-center gap-2">
          <Link to="/shop" aria-label="Back to shop">
            <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
              <ArrowLeft /> Shop
            </Button>
          </Link>
          <span className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Bell className="size-4" /> Inbox / ইনবক্স
          </span>
        </div>
        {rows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            No notifications / কোনো নোটিফিকেশন নেই।
          </p>
        ) : (
          <ul className="space-y-2">
            {rows.map((n) => (
              <li
                key={n.id}
                className={`rounded-2xl border p-3 ${n.readAt ? "border-border bg-card" : "border-emerald/30 bg-emerald-soft"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold">{n.title}</p>
                  {!n.readAt && (
                    <button
                      type="button"
                      aria-label="Mark as read"
                      onClick={() => void markNotificationRead(n.id).then(load)}
                      className="text-[10px] font-semibold text-primary"
                    >
                      Mark read
                    </button>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
