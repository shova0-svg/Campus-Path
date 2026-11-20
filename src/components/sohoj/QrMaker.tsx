import { useEffect, useMemo, useState } from "react";
import { Building2, Copy, Download, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CampusLocation, Institute } from "@/lib/campus-data";
import { classesInRoom, type ClassRoutine } from "@/lib/routine";
import { buildingQrPayload, makeQrDataUrl, qrFileName, roomQrPayload, shareUrl } from "@/lib/qr";

interface Props {
  institute: Institute;
  rooms: CampusLocation[];
  routines: ClassRoutine[];
}

export function QrMaker({ institute, rooms, routines }: Props) {
  const [buildingId, setBuildingId] = useState(institute.buildings[0]?.id ?? "academic");
  const [roomCode, setRoomCode] = useState("");
  const [dataUrl, setDataUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const building = institute.buildings.find((b) => b.id === buildingId) ?? institute.buildings[0];
  const buildingRooms = useMemo(
    () => rooms.filter((r) => r.buildingId === buildingId),
    [rooms, buildingId],
  );
  const totalClasses = buildingRooms.reduce(
    (n, r) => n + classesInRoom(routines, r.name).length,
    0,
  );
  const floorList = [...new Set(buildingRooms.map((r) => r.floor))].sort((a, b) => a - b);

  const payload = roomCode.trim()
    ? roomQrPayload(institute.id, buildingId, roomCode.trim())
    : buildingQrPayload(institute.id, buildingId);

  useEffect(() => {
    let cancelled = false;
    setBusy(true);
    makeQrDataUrl(payload)
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) toast.error("QR banate parini");
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [payload]);

  function download() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = qrFileName({
      instituteId: institute.id,
      buildingId,
      kind: roomCode.trim() ? "room" : "building",
      ...(roomCode.trim() ? { room: roomCode.trim() } : {}),
    });
    a.click();
    toast.success("QR download hoyeche — print kore building-e lagao");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl(payload));
      toast.success("Share link copy hoyeche");
    } catch {
      toast.error("Copy kora jay ni");
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4">
      <p className="text-xs text-muted-foreground">
        Building-er information diye QR banao. QR print kore building-e lagale student scan kore oi
        building-er sob room, class ar sir-er naam dekhte parbe.
      </p>

      <div className="mt-3 space-y-2 rounded-2xl border border-border bg-muted/40 p-3">
        <label className="text-[11px] font-semibold text-muted-foreground">Institute</label>
        <Input value={institute.name} readOnly className="h-10 rounded-xl" />

        <label className="pt-1 text-[11px] font-semibold text-muted-foreground">Building</label>
        <Select value={buildingId} onValueChange={(v) => setBuildingId(v)}>
          <SelectTrigger className="h-10 rounded-xl" aria-label="Building for QR">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {institute.buildings.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          <div className="rounded-xl bg-card p-2">
            <p className="text-sm font-bold text-primary">{buildingRooms.length}</p>
            <p className="text-[9px] text-muted-foreground">Rooms</p>
          </div>
          <div className="rounded-xl bg-card p-2">
            <p className="text-sm font-bold text-primary">{floorList.length}</p>
            <p className="text-[9px] text-muted-foreground">Floors</p>
          </div>
          <div className="rounded-xl bg-card p-2">
            <p className="text-sm font-bold text-emerald">{totalClasses}</p>
            <p className="text-[9px] text-muted-foreground">Classes</p>
          </div>
        </div>
        {building?.look && (
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Building2 className="size-3" /> {building.look}
          </p>
        )}

        <label className="pt-1 text-[11px] font-semibold text-muted-foreground">
          Room code (optional — room-specific QR)
        </label>
        <Input
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          placeholder="e.g. 1305 — chere dil-e building QR"
          className="h-10 rounded-xl"
        />
      </div>

      <div className="mt-3 flex flex-col items-center rounded-2xl border border-border bg-card p-4">
        {busy || !dataUrl ? (
          <div className="grid size-44 place-items-center rounded-xl bg-muted text-muted-foreground">
            <QrCode className="size-10 animate-pulse" />
          </div>
        ) : (
          <img src={dataUrl} alt="Building QR code" className="size-44 rounded-xl bg-white p-1" />
        )}
        <p className="mt-2 break-all text-center font-mono text-[10px] text-muted-foreground">
          {payload}
        </p>
        <div className="mt-3 flex w-full gap-2">
          <Button variant="emerald" className="flex-1" onClick={download} disabled={!dataUrl}>
            <Download className="size-4" /> Download PNG
          </Button>
          <Button variant="outline" onClick={copyLink} aria-label="Copy share link">
            <Copy className="size-4" />
          </Button>
        </div>
      </div>

      <p className="mt-2 text-center text-[10px] text-muted-foreground">
        Print kore {building?.name ?? "building"}-er prveshmukh-e lagan ✅
      </p>
    </div>
  );
}
