import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { listMyRequests, updateRequest, type PurchaseRequest } from "@/lib/repo/shopRequests";
import { requestStatusLabel, type RequestStatus } from "@/lib/shop-requests";
import { getProduct } from "@/lib/repo/shop";

export const Route = createFileRoute("/shop/requests")({
  head: () => ({ meta: [{ title: "My Requests — Campus Path" }] }),
  component: MyRequests,
});

function MyRequests() {
  const [rows, setRows] = useState<PurchaseRequest[]>([]);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [pendingCancel, setPendingCancel] = useState<PurchaseRequest | null>(null);

  const load = useCallback(async () => {
    const requests = await listMyRequests();
    setRows(requests);
    const next: Record<string, string> = {};
    for (const r of requests) {
      if (!next[r.productId]) {
        const p = await getProduct(r.productId);
        next[r.productId] = p?.title ?? "Item";
      }
    }
    setTitles(next);
  }, []);

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
            <ShoppingBag className="size-4" /> My Requests / আমার অনুরোধ
          </span>
        </div>

        {rows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            No requests yet / এখনো কোনো অনুরোধ নেই।
          </p>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.id} className="rounded-2xl border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {titles[r.productId] ?? "Item"}
                  </p>
                  <span className="shrink-0 rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-bold text-primary">
                    {requestStatusLabel(r.status as RequestStatus)}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Qty {r.quantity} · {new Date(r.createdAt).toLocaleDateString()}
                </p>
                {r.message && <p className="mt-1 text-xs">{r.message}</p>}
                {r.status === "pending" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => setPendingCancel(r)}
                  >
                    Cancel request
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>

      <AlertDialog open={pendingCancel !== null} onOpenChange={(o) => !o && setPendingCancel(null)}>
        <AlertDialogContent className="max-w-sm rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this request?</AlertDialogTitle>
            <AlertDialogDescription>You can send a new request later.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pendingCancel) return;
                void updateRequest(pendingCancel.id, { status: "cancelled" })
                  .then(() => {
                    setPendingCancel(null);
                    void load();
                    toast.success("Request cancelled");
                  })
                  .catch(() => toast.error("Could not cancel"));
              }}
            >
              Cancel request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
