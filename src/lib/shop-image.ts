import { supabase } from "@/integrations/supabase/client";

/** Single source of truth for shop image URLs. Handles old full URLs and paths. */
export const SHOP_BUCKET = "shop-images";

export function shopImageUrl(value: string | null | undefined): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  // Legacy full URL (or data URL): use it directly, never prefix it again.
  if (/^(https?:\/\/|data:)/i.test(trimmed)) return trimmed;
  const path = trimmed.replace(/^\/+/, "").replace(new RegExp(`^${SHOP_BUCKET}/`), "");
  if (!path) return "";
  return supabase.storage.from(SHOP_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Accept a WebP blob only when it is real; otherwise keep the original file. */
export async function compressForUpload(file: File): Promise<{ blob: Blob; type: string }> {
  if (typeof createImageBitmap !== "function" || typeof document === "undefined")
    return { blob: file, type: file.type || "application/octet-stream" };
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.78),
    );
    if (!blob || blob.size === 0) throw new Error("empty blob");
    return { blob, type: "image/webp" };
  } catch {
    if (file.size === 0) throw new Error("Empty image file");
    return { blob: file, type: file.type || "application/octet-stream" };
  }
}
