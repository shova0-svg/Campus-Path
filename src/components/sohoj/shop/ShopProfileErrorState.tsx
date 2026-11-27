import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ShopProfileError } from "@/hooks/use-shop-profile";

export function ShopProfileErrorState({
  error,
  onRetry,
}: {
  error: ShopProfileError;
  onRetry: () => void;
}) {
  return (
    <div className="bg-desk min-h-dvh px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6">
      <main className="mx-auto max-w-md rounded-3xl border border-border bg-card p-6 text-center shadow-[var(--shadow-card)]">
        <AlertCircle className="mx-auto size-8 text-destructive" />
        <p className="mt-3 text-sm font-semibold">
          প্রোফাইল লোড করা যায়নি / Could not load shop profile
        </p>
        <p className="mt-1 break-words text-[11px] text-muted-foreground">{error.message}</p>
        <p className="mt-1 text-[10px] text-muted-foreground">Ref: {error.refId}</p>
        <Button className="mt-4" variant="emerald" onClick={onRetry}>
          <RotateCcw /> Retry / আবার চেষ্টা
        </Button>
      </main>
    </div>
  );
}
