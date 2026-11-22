import { cn } from "@/lib/utils";

interface Props {
  variant?: "icon" | "full";
  /** Icon height in pixels. */
  size?: number;
  className?: string;
  showTagline?: boolean;
}

/**
 * Campus Path brand mark. Uses the uploaded square icon plus live text so the
 * wordmark inherits light/dark colors. The fixed-color horizontal SVG is only
 * for light-background print/share use (README, og:image), never the app UI.
 */
export function Logo({ variant = "full", size = 40, className, showTagline = false }: Props) {
  if (variant === "icon") {
    return (
      <img
        src="/brand/campus-path-icon.svg"
        alt="Campus Path"
        width={size}
        height={size}
        className={cn("shrink-0", className)}
      />
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)} aria-label="Campus Path">
      <img
        src="/brand/campus-path-icon.svg"
        alt="Campus Path"
        width={size}
        height={size}
        className="shrink-0"
      />
      <span className="flex min-w-0 flex-col leading-none">
        <span
          className="whitespace-nowrap font-display leading-tight tracking-tight"
          style={{ fontSize: Math.max(15, size * 0.45) }}
        >
          <span className="font-light text-foreground">Campus </span>
          <span className="font-bold text-[#C9962F] dark:text-[#F0CC76]">Path</span>
        </span>
        {showTagline && (
          <span className="mt-1 flex flex-col gap-0.5">
            <span className="text-[10px] font-medium tracking-wide text-muted-foreground">
              Find your way on campus
            </span>
            <span className="font-bangla text-[10px] text-muted-foreground">
              ক্যাম্পাসে নিজের পথ খুঁজে নিন
            </span>
          </span>
        )}
      </span>
    </span>
  );
}
