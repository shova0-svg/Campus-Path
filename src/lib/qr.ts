import QRCode from "qrcode";

/** What a printed QR code points at. Building codes open the building's room list. */
export interface QrTarget {
  instituteId: string;
  buildingId: string;
  kind: "building" | "room";
  /** Only set for room-level QR codes. */
  room?: string;
}

const PREFIX = "SOHOJ1";

export function buildingQrPayload(instituteId: string, buildingId: string): string {
  return `${PREFIX}|${instituteId}|${buildingId}|building`;
}

export function roomQrPayload(instituteId: string, buildingId: string, room: string): string {
  return `${PREFIX}|${instituteId}|${buildingId}|room|${room}`;
}

/** Accepts the raw QR text and also a shared https link carrying ?qr=… */
export function decodeQr(raw: string | null | undefined): QrTarget | null {
  if (!raw) return null;
  let text = raw.trim();
  try {
    if (/^https?:\/\//i.test(text)) {
      const url = new URL(text);
      text = url.searchParams.get("qr") ?? text;
    }
  } catch {
    /* not a URL — keep raw text */
  }
  const parts = text.split("|");
  if (parts[0] !== PREFIX || !parts[1] || !parts[2]) return null;
  const kind = parts[3] === "room" ? "room" : parts[3] === "building" ? "building" : null;
  if (!kind) return null;
  const room = kind === "room" ? parts[4] : undefined;
  if (kind === "room" && !room) return null;
  return {
    instituteId: parts[1],
    buildingId: parts[2],
    kind,
    ...(room ? { room } : {}),
  };
}

export function shareUrl(payload: string): string {
  const base = typeof window !== "undefined" ? window.location.origin : "https://sohoj-rasta.app";
  return `${base}/?qr=${encodeURIComponent(payload)}`;
}

/** Draws a PNG data URL for the given payload (works in the browser only). */
export function makeQrDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, {
    width: 512,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#12224a", light: "#ffffff" },
  });
}

export function qrFileName(target: QrTarget): string {
  const suffix = target.kind === "room" ? `room-${target.room}` : target.buildingId;
  return `sohoj-${target.instituteId}-${suffix}.png`;
}
