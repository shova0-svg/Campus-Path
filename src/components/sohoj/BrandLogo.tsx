import { cn } from "@/lib/utils";

/** A winding path ending in a location pin — the Sohoj Rasta mark. */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "grid size-11 place-items-center rounded-2xl bg-primary-foreground shadow-[var(--shadow-card)]",
        className,
      )}
    >
      <svg viewBox="0 0 40 40" className="size-8" aria-hidden="true">
        <path
          d="M8 34 C 8 24, 26 26, 24 18 C 22 11, 12 14, 14 8"
          className="fill-none stroke-primary"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M8 34 C 8 24, 26 26, 24 18 C 22 11, 12 14, 14 8"
          className="fill-none stroke-primary-foreground"
          strokeWidth="1"
          strokeDasharray="2 3"
          strokeLinecap="round"
        />
        <path
          d="M30 4c-3.3 0-6 2.6-6 5.9 0 4.3 6 10.1 6 10.1s6-5.8 6-10.1C36 6.6 33.3 4 30 4z"
          className="fill-emerald"
        />
        <circle cx="30" cy="10" r="2.2" className="fill-primary-foreground" />
      </svg>
    </div>
  );
}
