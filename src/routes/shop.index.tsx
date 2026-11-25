import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Plus, RefreshCw, Search, Store, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductCard } from "@/components/sohoj/shop/ProductCard";
import {
  SHOP_CATEGORIES,
  SHOP_CONDITIONS,
  type ShopCategory,
  type ShopCondition,
  type ShopProduct,
  type ShopSort,
} from "@/lib/shop";
import { currentShopInstitute } from "@/lib/shop-scope";
import { useConnectivity } from "@/hooks/use-connectivity";
import { listProducts } from "@/lib/repo/shop";
import { useShopProfile } from "@/hooks/use-shop-profile";
import { ShopAccessGate } from "@/components/sohoj/shop/ShopAccessGate";

export const Route = createFileRoute("/shop/")({
  head: () => ({
    meta: [
      { title: "Campus Shop — Campus Path" },
      {
        name: "description",
        content: "Buy and sell used items with classmates. Pay in person on campus.",
      },
    ],
  }),
  component: ShopHome,
});

function ShopHome() {
  const { profile, loading: profileLoading, refresh: refreshProfile } = useShopProfile();
  const institute = currentShopInstitute();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [category, setCategory] = useState<ShopCategory | "all">("all");
  const [condition, setCondition] = useState<ShopCondition | "all">("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<ShopSort>("newest");
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const { online } = useConnectivity();
  const touchY = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const load = useCallback(
    async (nextPage: number, append = false) => {
      if (nextPage === 0) setLoading(true);
      setBusy(true);
      const min = minPrice.trim() === "" ? undefined : Number(minPrice);
      const max = maxPrice.trim() === "" ? undefined : Number(maxPrice);
      const result = await listProducts(
        institute,
        {
          query: debounced,
          ...(category !== "all" ? { category } : {}),
          ...(condition !== "all" ? { condition } : {}),
          ...(min !== undefined && Number.isFinite(min) ? { minPrice: min } : {}),
          ...(max !== undefined && Number.isFinite(max) ? { maxPrice: max } : {}),
          sort,
        },
        nextPage,
      );
      setProducts((prev) => (append ? [...prev, ...result.items] : result.items));
      setHasMore(result.hasMore);
      setPage(nextPage);
      setLoading(false);
      setBusy(false);
    },
    [institute, debounced, category, condition, minPrice, maxPrice, sort],
  );

  useEffect(() => {
    void load(0);
  }, [load]);

  function onTouchStart(y: number) {
    touchY.current = y;
  }

  function onTouchEnd(y: number) {
    if (y - touchY.current > 70 && window.scrollY < 20 && !busy) void load(0);
  }

  if (profileLoading) {
    return (
      <div className="bg-desk min-h-dvh px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6">
        <div className="mx-auto max-w-md space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }
  if (!profile) {
    return <ShopAccessGate onReady={() => void refreshProfile()} />;
  }

  return (
    <div className="bg-desk min-h-dvh px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6">
      <main className="mx-auto w-full max-w-md space-y-4">
        <div className="flex items-center gap-2">
          <Link to="/" aria-label="Back to home">
            <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
              <ArrowLeft /> <span className="hidden sm:inline">Back to home</span>
            </Button>
          </Link>
          <span className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Store className="size-4" /> Campus Shop
          </span>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="shrink-0"
            aria-label="Notifications inbox"
          >
            <Link to="/shop/inbox">Inbox</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="shrink-0" aria-label="My Shop">
            <Link to="/shop/my">My Shop</Link>
          </Button>
          <Button variant="emerald" size="sm" asChild className="shrink-0">
            <Link to="/shop/new">
              <Plus className="size-4" /> Sell / বেচুন
            </Link>
          </Button>
        </div>

        {!online && (
          <p className="flex items-center gap-2 rounded-2xl border border-border bg-card p-3 text-[11px] text-muted-foreground">
            <WifiOff className="size-4" /> Offline — showing last loaded items / অফলাইন
          </p>
        )}

        <section className="space-y-3 rounded-3xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search items / আইটেম খুঁজুন"
              aria-label="Search shop items"
              className="h-11 rounded-xl pl-9"
            />
          </div>

          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
            <button
              type="button"
              onClick={() => setCategory("all")}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold ${category === "all" ? "bg-emerald text-emerald-foreground" : "bg-muted text-muted-foreground"}`}
            >
              All / সব
            </button>
            {SHOP_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold ${category === c.id ? "bg-emerald text-emerald-foreground" : "bg-muted text-muted-foreground"}`}
              >
                {c.label.split(" / ")[0]}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Select
              value={condition}
              onValueChange={(v) => setCondition(v as ShopCondition | "all")}
            >
              <SelectTrigger
                className="h-10 rounded-xl [&>span]:truncate"
                aria-label="Filter by condition"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any condition</SelectItem>
                {SHOP_CONDITIONS.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => setSort(v as ShopSort)}>
              <SelectTrigger className="h-10 rounded-xl [&>span]:truncate" aria-label="Sort items">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest / নতুন</SelectItem>
                <SelectItem value="price_asc">Price low → high</SelectItem>
                <SelectItem value="price_desc">Price high → low</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              min={0}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder="Min ৳"
              aria-label="Minimum price"
              className="h-10 rounded-xl"
            />
            <Input
              type="number"
              min={0}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Max ৳"
              aria-label="Maximum price"
              className="h-10 rounded-xl"
            />
          </div>
        </section>

        <div
          onTouchStart={(e) => onTouchStart(e.touches[0]!.clientY)}
          onTouchEnd={(e) => onTouchEnd(e.changedTouches[0]!.clientY)}
        >
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  className="animate-pulse overflow-hidden rounded-2xl border border-border bg-card"
                >
                  <div className="aspect-square bg-muted" />
                  <div className="space-y-2 p-3">
                    <div className="h-3 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center">
              <Store className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-semibold">No items yet / এখনো কোনো আইটেম নেই</p>
              <p className="font-bangla mt-1 text-xs text-muted-foreground">
                নতুন আইটেমের জন্য আবার চেষ্টা করুন।
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button size="sm" variant="outline" onClick={() => void load(0)} disabled={busy}>
                  <RefreshCw className={busy ? "animate-spin" : ""} /> Retry / আবার
                </Button>
                <Button size="sm" variant="emerald" asChild>
                  <Link to="/shop/new">
                    <Plus /> Add product / আইটেম দিন
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              <div className="mt-4 flex justify-center">
                {hasMore ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void load(page + 1, true)}
                    disabled={busy}
                  >
                    {busy ? "Loading…" : "Load more / আরও দেখুন"}
                  </Button>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    All items shown / সব দেখানো হয়েছে
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
