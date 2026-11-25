import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/sohoj/shop/ProductCard";
import { getProduct } from "@/lib/repo/shop";
import { listWishlistIds, toggleWishlist } from "@/lib/repo/wishlist";
import type { ShopProduct } from "@/lib/shop";

export const Route = createFileRoute("/shop/wishlist")({
  head: () => ({ meta: [{ title: "Wishlist — Campus Path" }] }),
  component: WishlistPage,
});

const SEGMENTS = [
  { to: "/shop", label: "Home" },
  { to: "/shop/wishlist", label: "Wishlist" },
  { to: "/shop/requests", label: "Requests" },
  { to: "/shop/my", label: "My Shop" },
] as const;

function WishlistPage() {
  const [ids, setIds] = useState<string[]>([]);
  const [products, setProducts] = useState<ShopProduct[]>([]);

  const load = useCallback(async () => {
    const wish = await listWishlistIds();
    setIds(wish);
    const found = await Promise.all(wish.map((id) => getProduct(id)));
    setProducts(found.filter((p): p is ShopProduct => Boolean(p)));
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function remove(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setIds((prev) => prev.filter((x) => x !== id));
    try {
      await toggleWishlist(id, true);
    } catch {
      void load();
    }
  }

  return (
    <div className="bg-desk min-h-dvh pb-[calc(7rem+env(safe-area-inset-bottom))]">
      <div className="sticky top-0 z-30 border-b border-border bg-background/95 px-4 pb-2 pt-[calc(0.75rem+env(safe-area-inset-top))] backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-2">
          <Link to="/shop" aria-label="Back to shop">
            <Button variant="ghost" size="icon" className="-ml-2">
              <ArrowLeft />
            </Button>
          </Link>
          <span className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Heart className="size-4" /> Wishlist / পছন্দ
          </span>
        </div>
        <div className="mx-auto mt-2 flex max-w-md gap-1 rounded-xl bg-muted p-1">
          {SEGMENTS.map((s) => (
            <Link
              key={s.to}
              to={s.to}
              className="flex-1 rounded-lg py-1.5 text-center text-[10px] font-semibold text-muted-foreground hover:bg-card hover:text-primary"
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>
      <main className="mx-auto w-full max-w-md px-4 pt-4">
        {products.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
            No wishlist items yet / এখনো কিছু পছন্দ করা হয়নি।
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                wishlisted
                onToggleWishlist={() => void remove(p.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
