import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, FileUp, Keyboard, QrCode, RefreshCw } from "lucide-react";
import jsQR from "jsqr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { decodeQr, type QrTarget } from "@/lib/qr";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDetected: (target: QrTarget) => void;
}

type Status = "starting" | "scanning" | "found" | "error";

export function QrScannerDialog({ open, onOpenChange, onDetected }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const doneRef = useRef(false);

  const [status, setStatus] = useState<Status>("starting");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const [manual, setManual] = useState("");
  const [found, setFound] = useState<QrTarget | null>(null);

  const stopCamera = useCallback(() => {
    if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const accept = useCallback(
    (raw: string) => {
      const target = decodeQr(raw);
      if (!target) {
        setStatus("error");
        setError("Ei code-ta chinte parini. Admin panel-e bangar QR check koro.");
        return;
      }
      doneRef.current = true;
      setFound(target);
      setStatus("found");
      stopCamera();
      setTimeout(() => {
        onDetected(target);
        onOpenChange(false);
      }, 900);
    },
    [onDetected, onOpenChange, stopCamera],
  );

  useEffect(() => {
    if (!open) {
      stopCamera();
      setStatus("starting");
      setError("");
      setFound(null);
      setManual("");
      setMode("camera");
      doneRef.current = false;
      return;
    }

    if (mode !== "camera") return;
    let cancelled = false;
    setStatus("starting");
    setError("");

    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera API ei browser-e nei — manual code use koro.");
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setStatus("scanning");

        const scan = () => {
          if (cancelled || doneRef.current) return;
          const v = videoRef.current;
          const canvas = canvasRef.current;
          if (v && canvas && v.readyState >= 2) {
            const w = v.videoWidth;
            const h = v.videoHeight;
            if (w && h) {
              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext("2d", { willReadFrequently: true });
              if (ctx) {
                ctx.drawImage(v, 0, 0, w, h);
                const image = ctx.getImageData(0, 0, w, h);
                const code = jsQR(image.data, w, h, { inversionAttempts: "dontInvert" });
                if (code?.data) {
                  accept(code.data);
                  return;
                }
              }
            }
          }
          frameRef.current = requestAnimationFrame(scan);
        };
        frameRef.current = requestAnimationFrame(scan);
      } catch (e) {
        if (cancelled) return;
        setStatus("error");
        setError(e instanceof Error ? e.message : "Camera khola jay ni.");
      }
    }
    void start();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [open, mode, accept, stopCamera]);

  async function handleImage(file: File | undefined) {
    if (!file) return;
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = canvasRef.current ?? document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(bitmap, 0, 0);
      const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(image.data, canvas.width, canvas.height);
      if (code?.data) accept(code.data);
      else {
        setStatus("error");
        setError("Image-e kono QR pawa jay ni.");
      }
      bitmap.close();
    } catch {
      setError("Image read kora jay ni.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm overflow-hidden rounded-3xl border-0 bg-scanner p-0 text-scanner-foreground">
        <DialogHeader className="px-6 pt-6 text-left">
          <DialogTitle className="flex items-center gap-2 text-scanner-foreground">
            <QrCode className="size-5 text-emerald" /> Scan building QR
          </DialogTitle>
          <DialogDescription className="font-bangla text-scanner-foreground/70">
            ভবনে লাগানো QR কোডের দিকে ক্যামেরা ধরুন — দেখা যাবে কোন কোন রুম ও ক্লাস আছে
          </DialogDescription>
        </DialogHeader>

        <div className="bg-scanner relative mx-6 mb-3 mt-2 aspect-square overflow-hidden rounded-2xl">
          {mode === "camera" ? (
            <>
              <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              <div className="pointer-events-none absolute inset-0 bg-scanner/20" />
              {[
                "left-4 top-4 border-l-4 border-t-4",
                "right-4 top-4 border-r-4 border-t-4",
                "bottom-4 left-4 border-b-4 border-l-4",
                "bottom-4 right-4 border-b-4 border-r-4",
              ].map((pos) => (
                <span key={pos} className={`absolute size-10 rounded-md border-emerald ${pos}`} />
              ))}
              {status === "scanning" && (
                <span className="animate-scan-line absolute inset-x-6 h-0.5 bg-emerald shadow-[0_0_16px_4px_var(--emerald)]" />
              )}
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-5 text-center">
              <Keyboard className="size-8 text-emerald" />
              <p className="text-xs text-scanner-foreground/70">
                QR-er nicher code-ta type koro (SOHOJ1|…)
              </p>
              <Input
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                placeholder="SOHOJ1|rpi|academic|building"
                className="h-10 rounded-xl bg-white/95 text-center font-mono text-[11px] text-foreground"
              />
              <Button variant="emerald" size="sm" onClick={() => accept(manual)}>
                <CheckCircle2 className="size-3.5" /> Check code
              </Button>
            </div>
          )}

          {status === "found" && found && (
            <div className="animate-rise absolute inset-0 grid place-items-center bg-scanner/85">
              <div className="text-center">
                <CheckCircle2 className="mx-auto size-14 text-emerald" />
                <p className="mt-3 text-xs uppercase tracking-widest text-scanner-foreground/60">
                  Checkpoint detected
                </p>
                <p className="font-display mt-1 text-lg font-semibold">
                  {found.kind === "room" ? `Room ${found.room}` : found.buildingId}
                </p>
              </div>
            </div>
          )}
        </div>

        {status === "error" && (
          <p className="mx-6 mb-2 rounded-xl bg-destructive/20 px-3 py-2 text-center text-[11px] text-scanner-foreground">
            {error}
          </p>
        )}

        <div className="flex items-center justify-center gap-2 px-6 pb-3">
          <Button
            variant="glass"
            size="sm"
            onClick={() => setMode((m) => (m === "camera" ? "manual" : "camera"))}
          >
            {mode === "camera" ? (
              <Keyboard className="size-3.5" />
            ) : (
              <Camera className="size-3.5" />
            )}
            {mode === "camera" ? "Type code" : "Use camera"}
          </Button>
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-primary-foreground/10 px-3 py-2 text-xs font-semibold">
            <FileUp className="size-3.5" /> QR image
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImage(e.target.files?.[0])}
            />
          </label>
          {status === "error" && (
            <Button
              variant="glass"
              size="sm"
              onClick={() => setStatus("scanning")}
              aria-label="Retry"
            >
              <RefreshCw className="size-3.5" />
            </Button>
          )}
        </div>
        <p className="pb-5 text-center text-[11px] text-scanner-foreground/60">
          {status === "scanning"
            ? "Scanning…"
            : status === "starting"
              ? "Camera start hocche…"
              : ""}
        </p>
      </DialogContent>
    </Dialog>
  );
}
