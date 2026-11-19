import { useEffect, useState } from "react";
import { CheckCircle2, QrCode } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QR_START_POINT } from "@/lib/campus-data";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDetected: () => void;
}

export function QrScannerDialog({ open, onOpenChange, onDetected }: Props) {
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    if (!open) {
      setDetected(false);
      return;
    }
    const detect = setTimeout(() => setDetected(true), 1500);
    const close = setTimeout(() => {
      onDetected();
      onOpenChange(false);
    }, 2500);
    return () => {
      clearTimeout(detect);
      clearTimeout(close);
    };
  }, [open, onDetected, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm overflow-hidden rounded-3xl border-0 bg-scanner p-0 text-scanner-foreground">
        <DialogHeader className="px-6 pt-6 text-left">
          <DialogTitle className="flex items-center gap-2 text-scanner-foreground">
            <QrCode className="size-5 text-emerald" /> Scan QR Checkpoint
          </DialogTitle>
          <DialogDescription className="font-bangla text-scanner-foreground/70">
            ভবনের প্রবেশমুখ বা সিঁড়ির QR কোডের দিকে ক্যামেরা ধরুন
          </DialogDescription>
        </DialogHeader>

        <div className="bg-scanner relative mx-6 mb-6 mt-2 aspect-square overflow-hidden rounded-2xl">
          {/* Simulated QR code */}
          <div className="absolute inset-0 grid place-items-center">
            <div className="grid grid-cols-7 gap-1 opacity-60">
              {Array.from({ length: 49 }).map((_, i) => {
                const corner =
                  [0, 1, 2, 7, 9, 14, 15, 16, 4, 5, 6, 11, 13, 18, 19, 20, 28, 29, 30, 35, 37, 42, 43, 44].includes(i);
                const on = corner || (i * 7 + 3) % 5 < 2;
                return (
                  <span
                    key={i}
                    className={on ? "size-5 rounded-[3px] bg-scanner-foreground" : "size-5"}
                  />
                );
              })}
            </div>
          </div>

          {/* Viewfinder corners */}
          {["left-4 top-4 border-l-4 border-t-4", "right-4 top-4 border-r-4 border-t-4", "bottom-4 left-4 border-b-4 border-l-4", "bottom-4 right-4 border-b-4 border-r-4"].map(
            (pos) => (
              <span key={pos} className={`absolute size-10 rounded-md border-emerald ${pos}`} />
            ),
          )}

          {!detected && (
            <span className="absolute inset-x-6 h-0.5 bg-emerald shadow-[0_0_16px_4px_var(--emerald)] animate-scan-line" />
          )}

          {detected && (
            <div className="absolute inset-0 grid place-items-center bg-scanner/80 animate-rise">
              <div className="text-center">
                <CheckCircle2 className="mx-auto size-14 text-emerald" />
                <p className="mt-3 text-xs uppercase tracking-widest text-scanner-foreground/60">
                  Checkpoint detected
                </p>
                <p className="mt-1 font-display text-lg font-semibold">{QR_START_POINT.name}</p>
                <p className="font-bangla text-sm text-scanner-foreground/70">{QR_START_POINT.nameBn}</p>
              </div>
            </div>
          )}
        </div>
        <p className="-mt-3 pb-5 text-center text-xs text-scanner-foreground/60">
          {detected ? "Setting as your starting point…" : "Scanning…"}
        </p>
      </DialogContent>
    </Dialog>
  );
}
