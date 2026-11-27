import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle, ArrowLeft, BadgeCheck, Eye, Package, Plus, RotateCcw } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GoogleLogo } from "@/components/sohoj/GoogleLogo";
import { EditShopProfileDialog } from "@/components/sohoj/shop/EditShopProfileDialog";
import { ShopAccessGate } from "@/components/sohoj/shop/ShopAccessGate";
import { ShopImage } from "@/components/sohoj/shop/ShopImage";
import { ShopProfileErrorState } from "@/components/sohoj/shop/ShopProfileErrorState";
import { useAuth } from "@/hooks/use-auth";
import { useShopProfile } from "@/hooks/use-shop-profile";
import {
  categoryLabel,
  SHOP_STATUS_TABS,
  statusLabel,
  formatPrice,
  type ShopProduct,
  type ShopStatus,
} from "@/lib/shop";
import {
  deleteProduct,
  imageUrl,
  listMyProducts,
  relistProduct,
  setProductStatus,
} from "@/lib/repo/shop";
import { signInWithGoogle } from "@/lib/supabase-auth";
import { listIncomingRequests, updateRequest, type PurchaseRequest } from "@/lib/repo/shopRequests";
import { REQUEST_SAFETY_NOTE, requestStatusLabel, type RequestStatus } from "@/lib/shop-requests";

export const Route = createFileRoute("/shop/my")({
  head: () => ({ meta: [{ title: "My Shop — Campus Path" }] }),
  component: MyShop,
});

function statusValue(status: ShopStatus): ShopStatus {
  return status === "removed" ? "hidden" : status;
}

function MyShop() {
  const { user } = useAuth();
  const { profile, loading, checked, error, refresh } = useShopProfile();
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [productLoading, setProductLoading] = useState(true);
  const [productError, setProductError] = useState<{ refId: string; message: string } | null>(null);
  const [tab, setTab] = useState<ShopStatus>("available");
  const [pendingDelete, setPendingDelete] = useState<ShopProduct | null>(null);
  const [editProfile, setEditProfile] = useState(false);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<"products" | "requests">("products");
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [pendingAction, setPendingAction] = useState<{
    request: PurchaseRequest;
    status: RequestStatus;
  } | null>(null);

  const load = useCallback(async () => {
    const uid = user?.id;
    if (!uid) return;
    setProductLoading(true);
    setProductError(null);
    try {
      setProducts(await listMyProducts(uid));
    } catch (e) {
      setProductError({
        refId: crypto.randomUUID().slice(0, 8),
        message: e instanceof Error ? e.message : "Could not load items / আইটেম লোড করা যায়নি",
      });
    } finally {
      setProductLoading(false);
    }
    setRequests(await listIncomingRequests());
  }, [user]);
  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(
    () => ({
      active: products.filter((p) => p.status === "available" || p.status === "reserved").length,
      sold: products.filter((p) => p.status === "sold").length,
      hidden: products.filter((p) => statusValue(p.status) === "hidden").length,
      views: products.reduce((sum, p) => sum + p.views, 0),
    }),
    [products],
  );
  const shown = products.filter((p) => statusValue(p.status) === tab);

  async function changeStatus(product: ShopProduct, status: ShopStatus) {
    setBusy(true);
    try {
      await setProductStatus(product.id, status);
      await load();
      toast.success("Status updated / অবস্থা বদলেছে");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update / বদলানো যায়নি");
    } finally {
      setBusy(false);
    }
  }

  if (loading || (user && !checked)) {
    return (
      <div className="bg-desk grid min-h-dvh place-items-center pb-[calc(7rem+env(safe-area-inset-bottom))]">
        <Package className="size-8 animate-pulse text-muted-foreground" />
      </div>
    );
  }
  if (error) return <ShopProfileErrorState error={error} onRetry={() => void refresh()} />;
  if (!user) {
    return (
      <div className="bg-desk min-h-dvh px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6">
        <main className="mx-auto max-w-md rounded-3xl border border-border bg-card p-8 text-center">
          <p className="text-sm font-semibold">Sign in to manage your shop</p>
          <Button className="mt-4 w-full" onClick={() => void signInWithGoogle()}>
            <GoogleLogo /> Continue with Google
          </Button>
        </main>
      </div>
    );
  }
  if (!profile) return <ShopAccessGate onReady={() => void refresh()} />;

  return (
    <div className="bg-desk min-h-dvh px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6">
      <main className="mx-auto w-full max-w-md space-y-4">
        <div className="flex items-center gap-2">
          <Link to="/shop" aria-label="Back to shop">
            <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
              <ArrowLeft /> <span className="hidden sm:inline">Shop</span>
            </Button>
          </Link>
          <span className="ml-auto text-xs font-semibold text-primary">My Shop / আমার দোকান</span>
        </div>

        <section className="flex items-center gap-3 rounded-3xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
          <ShopImage
            src={imageUrl(profile.avatarUrl ?? "")}
            alt={profile.shopName}
            className="size-14 shrink-0 rounded-2xl"
          />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 truncate text-sm font-bold">
              {profile.shopName}
              {profile.isVerified && <BadgeCheck className="size-4 shrink-0 text-emerald" />}
            </p>
            <p className="truncate text-[10px] text-muted-foreground">{profile.department}</p>
            <p className="mt-1 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
              <span>{stats.active} active</span>
              <span>{stats.sold} sold</span>
              <span>{stats.hidden} hidden</span>
              <span className="flex items-center gap-0.5">
                <Eye className="size-3" />
                {stats.views}
              </span>
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setEditProfile(true)}>
            Edit
          </Button>
        </section>

        <Button variant="emerald" className="w-full" asChild>
          <Link to="/shop/new">
            <Plus /> Add product / পণ্য যোগ করুন
          </Link>
        </Button>

        <div className="flex gap-1 rounded-xl bg-muted p-1">
          {(["products", "requests"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`flex-1 rounded-lg py-1.5 text-[11px] font-semibold ${view === v ? "bg-card text-primary shadow-sm" : "text-muted-foreground"}`}
            >
              {v === "products"
                ? "Products / পণ্য"
                : `Orders / Requests (${requests.filter((r) => r.status === "pending").length})`}
            </button>
          ))}
        </div>

        {view === "products" && (
          <>
            <div className="flex gap-1 overflow-x-auto rounded-xl bg-muted p-1 [scrollbar-width:none]">
              {SHOP_STATUS_TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${tab === t.id ? "bg-card text-primary shadow-sm" : "text-muted-foreground"}`}
                >
                  {t.label.split(" / ")[0]} (
                  {products.filter((p) => statusValue(p.status) === t.id).length})
                </button>
              ))}
            </div>

            {productLoading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            ) : productError ? (
              <div className="rounded-2xl border border-border bg-card p-6 text-center">
                <AlertCircle className="mx-auto size-7 text-destructive" />
                <p className="mt-2 text-xs font-semibold">
                  আইটেম লোড করা যায়নি / Could not load items
                </p>
                <p className="mt-1 break-words text-[10px] text-muted-foreground">
                  {productError.message} · Ref: {productError.refId}
                </p>
                <Button className="mt-3" size="sm" variant="outline" onClick={() => void load()}>
                  <RotateCcw /> Retry / আবার চেষ্টা
                </Button>
              </div>
            ) : shown.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-center">
                <p className="text-xs text-muted-foreground">
                  No products here / এখানে কোনো আইটেম নেই।
                </p>
                <Button className="mt-3" size="sm" variant="emerald" asChild>
                  <Link to="/shop/new">
                    <Plus /> Add your first product / প্রথম আইটেম যোগ করুন
                  </Link>
                </Button>
              </div>
            ) : (
              <ul className="space-y-2">
                {shown.map((p) => (
                  <li key={p.id} className="rounded-2xl border border-border bg-card p-3">
                    <div className="flex gap-3">
                      <ShopImage
                        src={imageUrl(p.images[0] ?? "")}
                        alt={p.title}
                        className="size-16 shrink-0 rounded-xl"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{p.title}</p>
                        <p className="text-xs font-bold text-emerald">{formatPrice(p.price)}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Qty {p.quantity} · {categoryLabel(p.category)} · {p.views} views
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(p.createdAt).toLocaleDateString("en-GB")}
                        </p>
                      </div>
                      <span className="self-start rounded-full bg-primary-soft px-2 py-1 text-[9px] font-bold text-primary">
                        {statusLabel(p.status)}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      <Button size="sm" variant="outline" asChild>
                        <Link to="/shop/new" search={{ edit: p.id }}>
                          Edit
                        </Link>
                      </Button>
                      <Select
                        value={statusValue(p.status)}
                        onValueChange={(v) => void changeStatus(p, v as ShopStatus)}
                        disabled={busy}
                      >
                        <SelectTrigger
                          className="h-8 w-auto rounded-lg text-[10px]"
                          aria-label="Status"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SHOP_STATUS_TABS.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Delete ${p.title}`}
                        onClick={() => setPendingDelete(p)}
                      >
                        Delete
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {view === "requests" &&
          (requests.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              No requests yet / এখনো কোনো অনুরোধ নেই।
            </p>
          ) : (
            <ul className="space-y-2">
              {requests.map((r) => (
                <li key={r.id} className="rounded-2xl border border-border bg-card p-3">
                  <p className="text-[11px] text-muted-foreground">
                    Qty {r.quantity} · {requestStatusLabel(r.status as RequestStatus)}
                  </p>
                  {r.message && <p className="mt-1 text-xs">{r.message}</p>}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {r.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPendingAction({ request: r, status: "accepted" })}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPendingAction({ request: r, status: "rejected" })}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {r.status === "accepted" && (
                      <Button
                        size="sm"
                        variant="emerald"
                        onClick={() => setPendingAction({ request: r, status: "completed" })}
                      >
                        Completed
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ))}
      </main>

      <AlertDialog open={pendingAction !== null} onOpenChange={(o) => !o && setPendingAction(null)}>
        <AlertDialogContent className="max-w-sm rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.status === "accepted"
                ? "Accept this request?"
                : pendingAction?.status === "completed"
                  ? "Mark as completed?"
                  : "Reject this request?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.status === "accepted"
                ? REQUEST_SAFETY_NOTE
                : "This will notify the buyer."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pendingAction) return;
                void updateRequest(pendingAction.request.id, { status: pendingAction.status })
                  .then(() => {
                    setPendingAction(null);
                    void load();
                    toast.success("Request updated");
                  })
                  .catch(() => toast.error("Could not update request"));
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={pendingDelete !== null} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent className="max-w-sm rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              Its images will also be removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              disabled={busy}
              onClick={() => {
                if (!pendingDelete) return;
                const id = pendingDelete.id;
                setBusy(true);
                void deleteProduct(id)
                  .then(() => {
                    setPendingDelete(null);
                    void load();
                    toast.success("Product deleted / আইটেম মুছে ফেলা হয়েছে");
                  })
                  .catch((e: unknown) =>
                    toast.error(
                      e instanceof Error ? e.message : "Could not delete / মুছে ফেলা যায়নি",
                    ),
                  )
                  .finally(() => setBusy(false));
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditShopProfileDialog
        open={editProfile}
        onOpenChange={setEditProfile}
        profile={profile}
        onSaved={() => void refresh()}
      />
    </div>
  );
}
