import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
}

/** Reserves the image box, shows a skeleton while loading and a placeholder on error. */
export function ShopImage({ src, alt, className, imgClassName }: Props) {
  const [state, setState] = useState<"loading" | "ready" | "error">(src ? "loading" : "error");

  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {state === "loading" && (
        <div className="absolute inset-0 animate-pulse bg-muted" aria-hidden="true" />
      )}
      {state === "error" ? (
        <div className="absolute inset-0 grid place-items-center text-muted-foreground" role="img" aria-label={`${alt} — image unavailable`}>
          <ImageOff className="size-8" />
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setState("ready")}
          onError={() => setState("error")}
          className={cn("size-full object-cover", imgClassName)}
        />
      )}
    </div>
  );
}
