import { Link } from "@tanstack/react-router";
import { Store } from "lucide-react";
import { categoryLabel, conditionLabel, formatPrice, timeAgo, type ShopProduct } from "@/lib/shop";
import { imageUrl } from "@/lib/repo/shop";

export function ProductCard({ product }: { product: ShopProduct }) {
  return (
    <Link
      to="/shop/$productId"
      params={{ productId: product.id }}
      className="animate-rise block overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-primary/30 active:scale-[0.99]"
    >
      <div className="relative aspect-square bg-muted">
        {product.images[0] ? (
          <img
            src={imageUrl(product.images[0]!)}
            alt={product.title}
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <span className="grid size-full place-items-center text-muted-foreground">
            <Store className="size-8" />
          </span>
        )}
        {product.status === "reserved" && (
          <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
            Reserved / রিজার্ভ
          </span>
        )}
      </div>
      <div className="space-y-1 p-3">
        <p className="line-clamp-2 min-h-9 text-xs font-semibold leading-tight">{product.title}</p>
        <p className="text-sm font-bold text-emerald">{formatPrice(product.price)}</p>
        <p className="truncate text-[10px] text-muted-foreground">
          {categoryLabel(product.category)} · {conditionLabel(product.condition)}
        </p>
        <p className="text-[10px] text-muted-foreground">{timeAgo(product.createdAt)}</p>
      </div>
    </Link>
  );
}
