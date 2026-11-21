import { useState } from "react";
import { DoorOpen, Expand, X } from "lucide-react";

/** Hotspots follow the institute's official ground-floor site plan. */
type Area = {
  id: string;
  label: string;
  labelBn: string;
  x: number;
  y: number;
  w: number;
  h: number;
  tone: "academic" | "office" | "lab" | "water" | "sport" | "road";
  buildingId?: string;
  detail: string;
};

const AREAS: Area[] = [
  {
    id: "road",
    label: "Main Road",
    labelBn: "প্রধান সড়ক",
    x: 0,
    y: 24,
    w: 1000,
    h: 78,
    tone: "road",
    detail: "Main public road along the north boundary.",
  },
  {
    id: "gate",
    label: "Main Gate",
    labelBn: "প্রধান ফটক",
    x: 224,
    y: 100,
    w: 92,
    h: 34,
    tone: "office",
    detail: "Main entrance of Rajshahi Govt. Polytechnic Institute.",
  },
  {
    id: "b1",
    label: "Building No. 01 · Office Room",
    labelBn: "১ নং ভবন · অফিস রুম",
    x: 282,
    y: 132,
    w: 320,
    h: 145,
    tone: "office",
    detail: "3-storey building: Office Room, Principal and admin sections.",
    buildingId: "admin",
  },
  {
    id: "teachers",
    label: "Teachers Club",
    labelBn: "শিক্ষক ক্লাব",
    x: 56,
    y: 160,
    w: 150,
    h: 118,
    tone: "office",
    detail: "Teachers' club room on the north-west corner.",
  },
  {
    id: "scout",
    label: "Scout Building",
    labelBn: "স্কাউট ভবন",
    x: 604,
    y: 166,
    w: 168,
    h: 112,
    tone: "office",
    detail: "Scout building next to the Office Room.",
  },
  {
    id: "balcony-n",
    label: "Balcony",
    labelBn: "ব্যালকনি",
    x: 152,
    y: 278,
    w: 620,
    h: 52,
    tone: "office",
    detail: "Common balcony in front of the office and class rooms.",
  },
  {
    id: "b2",
    label: "Building No. 02 · Class Room",
    labelBn: "২ নং ভবন · ক্লাসরুম",
    x: 56,
    y: 310,
    w: 152,
    h: 388,
    tone: "academic",
    detail: "3-storey building with class rooms and balcony.",
    buildingId: "civil",
  },
  {
    id: "b3",
    label: "Building No. 03 · Class Room",
    labelBn: "৩ নং ভবন · ক্লাসরুম",
    x: 826,
    y: 390,
    w: 120,
    h: 394,
    tone: "academic",
    detail: "3-storey building with class rooms and balcony.",
    buildingId: "electrical",
  },
  {
    id: "pond",
    label: "Pond · পুকুর",
    labelBn: "পুকুর",
    x: 286,
    y: 388,
    w: 424,
    h: 352,
    tone: "water",
    detail: "Central pond with paved banks on all four sides.",
  },
  {
    id: "b6",
    label: "Building No. 06 · Lab Room",
    labelBn: "৬ নং ভবন · ল্যাব রুম",
    x: 88,
    y: 788,
    w: 140,
    h: 196,
    tone: "lab",
    detail: "Single-storey laboratory block (south-west).",
    buildingId: "mechanical",
  },
  {
    id: "badminton",
    label: "Badminton Court",
    labelBn: "ব্যাডমিন্টন কোর্ট",
    x: 258,
    y: 826,
    w: 116,
    h: 148,
    tone: "sport",
    detail: "Outdoor badminton court between the lab blocks.",
  },
  {
    id: "b5",
    label: "Building No. 05 · Lab Room",
    labelBn: "৫ নং ভবন · ল্যাব রুম",
    x: 420,
    y: 790,
    w: 120,
    h: 194,
    tone: "lab",
    detail: "Single-storey laboratory block (south-center).",
    buildingId: "computer",
  },
  {
    id: "b4",
    label: "Building No. 04 · Lab Room",
    labelBn: "৪ নং ভবন · ল্যাব রুম",
    x: 642,
    y: 790,
    w: 120,
    h: 194,
    tone: "lab",
    detail: "Single-storey laboratory block (south-east).",
    buildingId: "electronics",
  },
];

const TONE: Record<Area["tone"], { fill: string; stroke: string; text: string }> = {
  academic: { fill: "fill-[#e2f0ea]", stroke: "stroke-[#3f8b78]", text: "fill-[#1d5c4c]" },
  office: { fill: "fill-[#eef1f4]", stroke: "stroke-[#7b8794]", text: "fill-[#334155]" },
  lab: { fill: "fill-[#e2f0ea]", stroke: "stroke-[#3f8b78]", text: "fill-[#1d5c4c]" },
  water: { fill: "fill-[#bfe3ef]", stroke: "stroke-[#2f8fb5]", text: "fill-[#14536e]" },
  sport: { fill: "fill-[#b8e0c4]", stroke: "stroke-[#2f8f52]", text: "fill-[#145c31]" },
  road: { fill: "fill-[#cfd4da]", stroke: "stroke-[#94a3b8]", text: "fill-[#334155]" },
};

export function RealCampusMap({
  onSelectBuilding,
}: {
  onSelectBuilding?: (buildingId: string) => void;
}) {
  const [selected, setSelected] = useState<Area | null>(null);
  const [zoom, setZoom] = useState(false);
  const [has3D, setHas3D] = useState(true);

  return (
    <div className="px-3 pb-3">
      <div className="overflow-hidden rounded-2xl border border-border bg-[#f7f6f2]">
        <svg
          viewBox="0 0 1000 1000"
          className="h-auto w-full"
          role="img"
          aria-label="Official ground floor map of Rajshahi Govt. Polytechnic Institute"
        >
          <rect width="1000" height="1000" className="fill-[#f7f6f2]" />
          <rect
            x="6"
            y="6"
            width="988"
            height="988"
            rx="10"
            className="fill-none stroke-border"
            strokeWidth="3"
            strokeDasharray="10 8"
          />

          {AREAS.map((area) => {
            const tone = TONE[area.tone];
            const active = selected?.id === area.id;
            const isPond = area.id === "pond";
            const isCourt = area.id === "badminton";
            const isRoad = area.id === "road";
            return (
              <g
                key={area.id}
                onClick={() => setSelected(area)}
                className="cursor-pointer"
                role="button"
                aria-label={`${area.label} — ${area.detail}`}
              >
                {isPond ? (
                  <>
                    <rect
                      x={area.x - 12}
                      y={area.y - 12}
                      width={area.w + 24}
                      height={area.h + 24}
                      rx="8"
                      className="fill-[#dfd9c8] stroke-[#b8ae94]"
                      strokeWidth="4"
                    />
                    <ellipse
                      cx={area.x + area.w / 2}
                      cy={area.y + area.h / 2}
                      rx={area.w / 2}
                      ry={area.h / 2}
                      className={`${tone.fill} ${tone.stroke}`}
                      strokeWidth="3"
                    />
                  </>
                ) : isRoad ? (
                  <>
                    <rect
                      x={area.x}
                      y={area.y}
                      width={area.w}
                      height={area.h}
                      className={`${tone.fill} ${tone.stroke}`}
                    />
                    <line
                      x1="0"
                      y1={area.y + area.h / 2}
                      x2="1000"
                      y2={area.y + area.h / 2}
                      className="stroke-white"
                      strokeWidth="4"
                      strokeDasharray="26 20"
                    />
                  </>
                ) : (
                  <rect
                    x={area.x}
                    y={area.y}
                    width={area.w}
                    height={area.h}
                    rx="5"
                    className={`${tone.fill} ${active ? "stroke-emerald" : tone.stroke} ${active ? "stroke-[6]" : "stroke-[3]"}`}
                  />
                )}

                {isCourt && (
                  <>
                    <rect
                      x={area.x + 10}
                      y={area.y + 10}
                      width={area.w - 20}
                      height={area.h - 20}
                      className="fill-none stroke-[#2f8f52]"
                      strokeWidth="2"
                    />
                    <line
                      x1={area.x + area.w / 2}
                      y1={area.y + 10}
                      x2={area.x + area.w / 2}
                      y2={area.y + area.h - 10}
                      className="stroke-[#2f8f52]"
                      strokeWidth="2"
                    />
                    <line
                      x1={area.x + 10}
                      y1={area.y + area.h / 2}
                      x2={area.x + area.w - 10}
                      y2={area.y + area.h / 2}
                      className="stroke-[#2f8f52]"
                      strokeWidth="2"
                    />
                  </>
                )}

                {!isRoad && (
                  <text
                    x={area.x + area.w / 2}
                    y={area.y + area.h / 2 - 2}
                    textAnchor="middle"
                    className={`${tone.text} pointer-events-none text-[15px] font-bold`}
                  >
                    {area.label.split(" · ")[0]}
                  </text>
                )}
                {!isRoad && (
                  <text
                    x={area.x + area.w / 2}
                    y={area.y + area.h / 2 + 18}
                    textAnchor="middle"
                    className={`${tone.text} pointer-events-none font-bangla text-[12px]`}
                  >
                    {area.labelBn.split(" · ")[0]}
                  </text>
                )}
                {isRoad && (
                  <text
                    x="500"
                    y={area.y + 24}
                    textAnchor="middle"
                    className={`${tone.text} pointer-events-none text-[16px] font-bold`}
                  >
                    {area.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Pond bank labels */}
          {[
            ["Pond bank", 500, 372],
            ["Pond bank", 500, 760],
          ].map(([label, x, y]) => (
            <text
              key={String(label)}
              x={Number(x)}
              y={Number(y)}
              textAnchor="middle"
              className="pointer-events-none fill-[#14536e] text-[13px] font-bold"
            >
              {label}
            </text>
          ))}
        </svg>

        {zoom && (
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
            onClick={() => setZoom(false)}
          >
            <div
              className="max-h-[92dvh] w-full max-w-3xl overflow-auto rounded-2xl bg-white p-2"
              onClick={(e) => e.stopPropagation()}
            >
              {has3D ? (
                <img
                  src="/rpi-campus-3d.png"
                  alt="3D model of Rajshahi Govt. Polytechnic campus"
                  className="w-full"
                  onError={() => setHas3D(false)}
                />
              ) : (
                <div className="p-4 text-center">
                  <p className="text-sm font-semibold">3D campus model</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Put the 3D render at <code>public/rpi-campus-3d.png</code> to see it here. The
                    live plan above is the official 2D site map and works offline.
                  </p>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setZoom(false)}
              className="absolute right-5 top-5 rounded-full bg-white p-2 text-foreground"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>
        )}
      </div>

      {selected && (
        <div className="mt-2 rounded-2xl border border-primary/20 bg-primary-soft/60 p-3">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{selected.label}</p>
              <p className="font-bangla text-xs text-muted-foreground">{selected.labelBn}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{selected.detail}</p>
            </div>
            {selected.buildingId && onSelectBuilding && (
              <button
                type="button"
                onClick={() => onSelectBuilding(selected.buildingId!)}
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-2.5 py-1.5 text-[11px] font-bold text-primary-foreground"
              >
                <DoorOpen className="size-3.5" /> Rooms
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-[11px] text-muted-foreground">
          Ground Floor · official site plan · tap a building
        </p>
        <button
          type="button"
          onClick={() => setZoom(true)}
          className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground"
        >
          <Expand className="size-3" /> 3D view
        </button>
      </div>
    </div>
  );
}
