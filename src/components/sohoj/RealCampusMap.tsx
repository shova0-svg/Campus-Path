import { useState } from "react";
import { Box, DoorOpen, Map as MapIcon, Trees } from "lucide-react";
import { cn } from "@/lib/utils";

/** Hotspots follow the institute's official ground-floor site plan. */
type Area = {
  id: string;
  label: string;
  labelBn: string;
  x: number;
  y: number;
  w: number;
  h: number;
  tone: "building" | "office" | "lab" | "water" | "sport" | "road";
  buildingId?: string;
  detail: string;
  floors?: number;
};

const AREAS: Area[] = [
  {
    id: "road",
    label: "Main Road",
    labelBn: "প্রধান সড়ক",
    x: 0,
    y: 18,
    w: 1000,
    h: 74,
    tone: "road",
    detail: "Main public road along the north boundary.",
  },
  {
    id: "gate",
    label: "Main Gate",
    labelBn: "প্রধান ফটক",
    x: 222,
    y: 92,
    w: 96,
    h: 30,
    tone: "office",
    detail: "Main entrance of Rajshahi Govt. Polytechnic Institute.",
  },
  {
    id: "b1",
    label: "Building 01 · Office",
    labelBn: "১ নং ভবন · অফিস",
    x: 280,
    y: 124,
    w: 324,
    h: 138,
    tone: "office",
    detail: "3-storey building — Office Room, Principal and admin sections.",
    buildingId: "admin",
    floors: 3,
  },
  {
    id: "teachers",
    label: "Teachers Club",
    labelBn: "শিক্ষক ক্লাব",
    x: 54,
    y: 154,
    w: 152,
    h: 110,
    tone: "office",
    detail: "Teachers' club room on the north-west corner.",
    floors: 2,
  },
  {
    id: "scout",
    label: "Scout Building",
    labelBn: "স্কাউট ভবন",
    x: 606,
    y: 158,
    w: 170,
    h: 104,
    tone: "office",
    detail: "Scout building next to the Office Room.",
    floors: 2,
  },
  {
    id: "balcony",
    label: "Balcony",
    labelBn: "ব্যালকনি",
    x: 150,
    y: 264,
    w: 626,
    h: 46,
    tone: "office",
    detail: "Common balcony in front of the office and class rooms.",
  },
  {
    id: "b2",
    label: "Building 02 · Class",
    labelBn: "২ নং ভবন · ক্লাসরুম",
    x: 54,
    y: 304,
    w: 152,
    h: 380,
    tone: "building",
    detail: "3-storey building with class rooms and balcony.",
    buildingId: "civil",
    floors: 3,
  },
  {
    id: "b3",
    label: "Building 03 · Class",
    labelBn: "৩ নং ভবন · ক্লাসরুম",
    x: 826,
    y: 382,
    w: 120,
    h: 388,
    tone: "building",
    detail: "3-storey building with class rooms and balcony.",
    buildingId: "electrical",
    floors: 3,
  },
  {
    id: "pond",
    label: "Pond",
    labelBn: "পুকুর",
    x: 286,
    y: 378,
    w: 424,
    h: 350,
    tone: "water",
    detail: "Central pond with paved banks on all four sides.",
  },
  {
    id: "b6",
    label: "Building 06 · Lab",
    labelBn: "৬ নং ভবন · ল্যাব",
    x: 86,
    y: 782,
    w: 142,
    h: 194,
    tone: "lab",
    detail: "Single-storey laboratory block (south-west).",
    buildingId: "mechanical",
    floors: 1,
  },
  {
    id: "badminton",
    label: "Badminton",
    labelBn: "ব্যাডমিন্টন কোর্ট",
    x: 258,
    y: 822,
    w: 116,
    h: 146,
    tone: "sport",
    detail: "Outdoor badminton court between the lab blocks.",
  },
  {
    id: "b5",
    label: "Building 05 · Lab",
    labelBn: "৫ নং ভবন · ল্যাব",
    x: 420,
    y: 784,
    w: 120,
    h: 192,
    tone: "lab",
    detail: "Single-storey laboratory block (south-center).",
    buildingId: "computer",
    floors: 1,
  },
  {
    id: "b4",
    label: "Building 04 · Lab",
    labelBn: "৪ নং ভবন · ল্যাব",
    x: 642,
    y: 784,
    w: 120,
    h: 192,
    tone: "lab",
    detail: "Single-storey laboratory block (south-east).",
    buildingId: "electronics",
    floors: 1,
  },
];

const TONE: Record<Area["tone"], { fill: string; side: string; stroke: string; text: string }> = {
  building: { fill: "#dcefe8", side: "#8db8aa", stroke: "#3f8b78", text: "#164b3e" },
  office: { fill: "#e9edf1", side: "#9da8b4", stroke: "#64748b", text: "#27364a" },
  lab: { fill: "#dcefe8", side: "#8db8aa", stroke: "#3f8b78", text: "#164b3e" },
  water: { fill: "#a9dcec", side: "#5aa9c6", stroke: "#2f8fb5", text: "#0f4a63" },
  sport: { fill: "#b6e3c3", side: "#69b984", stroke: "#2f8f52", text: "#124d30" },
  road: { fill: "#d5d9de", side: "#a3abb4", stroke: "#94a3b8", text: "#334155" },
};

function PlanSvg({
  selected,
  onSelect,
  is3D,
}: {
  selected: Area | null;
  onSelect: (a: Area) => void;
  is3D: boolean;
}) {
  return (
    <svg
      viewBox="0 0 1000 1000"
      className="h-auto w-full"
      role="img"
      aria-label="Official ground floor site plan of Rajshahi Govt. Polytechnic Institute"
    >
      <defs>
        <pattern id="pondRipple" width="26" height="14" patternUnits="userSpaceOnUse">
          <path
            d="M0 7 Q 6 2 13 7 T 26 7"
            fill="none"
            stroke="#7cc6df"
            strokeWidth="1.5"
            opacity="0.7"
          />
        </pattern>
        <pattern id="grass" width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="4" r="1.6" fill="#9ccfa9" opacity="0.6" />
          <circle cx="13" cy="12" r="1.2" fill="#8fc39e" opacity="0.5" />
        </pattern>
        <linearGradient id="pondFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bce8f4" />
          <stop offset="1" stopColor="#79c6e0" />
        </linearGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#1e3a5f" floodOpacity="0.18" />
        </filter>
      </defs>

      <rect width="1000" height="1000" fill="#f4f2ea" />
      <rect width="1000" height="1000" fill="url(#grass)" />
      <rect
        x="8"
        y="8"
        width="984"
        height="984"
        rx="12"
        fill="none"
        stroke="#c9c3ad"
        strokeWidth="4"
        strokeDasharray="12 9"
      />

      {/* Walkways */}
      <g fill="#e6e1d2">
        <rect x="205" y="110" width="100" height="870" />
        <rect x="700" y="260" width="120" height="520" />
        <rect x="140" y="258" width="720" height="46" />
        <rect x="140" y="740" width="720" height="44" />
      </g>

      {AREAS.map((area) => {
        const tone = TONE[area.tone];
        const active = selected?.id === area.id;
        const isPond = area.id === "pond";
        const isCourt = area.id === "badminton";
        const isRoad = area.id === "road";
        const isGate = area.id === "gate";
        const extrusion = is3D && area.floors ? Math.min(area.floors * 9, 26) : 0;

        return (
          <g
            key={area.id}
            onClick={() => onSelect(area)}
            className="cursor-pointer"
            role="button"
            aria-label={`${area.label} — ${area.detail}`}
            filter={is3D && !isRoad && !isPond ? "url(#softShadow)" : undefined}
          >
            {extrusion > 0 && (
              <path
                d={`M ${area.x} ${area.y + area.h} L ${area.x + area.w} ${area.y + area.h} L ${area.x + area.w} ${area.y + area.h + extrusion} L ${area.x} ${area.y + area.h + extrusion} Z`}
                fill={tone.side}
              />
            )}
            {isPond ? (
              <>
                <rect
                  x={area.x - 14}
                  y={area.y - 14}
                  width={area.w + 28}
                  height={area.h + 28}
                  rx="10"
                  fill="#dfd8c4"
                  stroke="#b9ad90"
                  strokeWidth="4"
                />
                <rect
                  x={area.x - 4}
                  y={area.y - 4}
                  width={area.w + 8}
                  height={area.h + 8}
                  rx="6"
                  fill="none"
                  stroke="#a9c8b5"
                  strokeWidth="5"
                />
                <rect
                  x={area.x}
                  y={area.y}
                  width={area.w}
                  height={area.h}
                  rx="4"
                  fill="url(#pondFill)"
                  stroke={tone.stroke}
                  strokeWidth="3"
                />
                <rect
                  x={area.x}
                  y={area.y}
                  width={area.w}
                  height={area.h}
                  fill="url(#pondRipple)"
                />
              </>
            ) : isRoad ? (
              <>
                <rect x={area.x} y={area.y} width={area.w} height={area.h} fill={tone.fill} />
                <line
                  x1="0"
                  y1={area.y + area.h / 2}
                  x2="1000"
                  y2={area.y + area.h / 2}
                  stroke="#fff"
                  strokeWidth="5"
                  strokeDasharray="28 22"
                />
              </>
            ) : (
              <rect
                x={area.x}
                y={area.y}
                width={area.w}
                height={area.h}
                rx="5"
                fill={tone.fill}
                stroke={active ? "#10b981" : tone.stroke}
                strokeWidth={active ? 6 : 3}
              />
            )}

            {isGate && (
              <g>
                <rect x={area.x + 26} y={area.y + 16} width="8" height="18" fill="#64748b" />
                <rect x={area.x + 62} y={area.y + 16} width="8" height="18" fill="#64748b" />
                <line
                  x1={area.x + 26}
                  y1={area.y + 18}
                  x2={area.x + 70}
                  y2={area.y + 18}
                  stroke="#64748b"
                  strokeWidth="4"
                />
              </g>
            )}
            {isCourt && (
              <g stroke="#2f8f52" fill="none" strokeWidth="2">
                <rect x={area.x + 8} y={area.y + 8} width={area.w - 16} height={area.h - 16} />
                <line
                  x1={area.x + area.w / 2}
                  y1={area.y + 8}
                  x2={area.x + area.w / 2}
                  y2={area.y + area.h - 8}
                />
                <line
                  x1={area.x + 8}
                  y1={area.y + area.h / 2}
                  x2={area.x + area.w - 8}
                  y2={area.y + area.h / 2}
                />
              </g>
            )}

            {!isRoad && !isGate && (
              <g className="pointer-events-none">
                <rect
                  x={area.x + area.w / 2 - (area.label.length > 20 ? 88 : 70)}
                  y={area.y + area.h / 2 - 26}
                  width={area.label.length > 20 ? 176 : 140}
                  height="44"
                  rx="10"
                  fill="#ffffff"
                  opacity="0.82"
                />
                <text
                  x={area.x + area.w / 2}
                  y={area.y + area.h / 2 - 5}
                  textAnchor="middle"
                  fill={tone.text}
                  fontSize="15"
                  fontWeight="700"
                >
                  {area.label}
                </text>
                <text
                  x={area.x + area.w / 2}
                  y={area.y + area.h / 2 + 13}
                  textAnchor="middle"
                  fill={tone.text}
                  fontSize="12"
                  className="font-bangla"
                >
                  {area.labelBn}
                </text>
              </g>
            )}
            {isRoad && (
              <text
                x="500"
                y={area.y + 26}
                textAnchor="middle"
                fill={tone.text}
                fontSize="17"
                fontWeight="700"
                className="pointer-events-none"
              >
                Main Road · প্রধান সড়ক
              </text>
            )}
            {isGate && (
              <text
                x={area.x + area.w / 2}
                y={area.y + 48}
                textAnchor="middle"
                fill={tone.text}
                fontSize="13"
                fontWeight="700"
                className="pointer-events-none"
              >
                Main Gate
              </text>
            )}
          </g>
        );
      })}

      {/* Pond bank labels */}
      {[
        { y: 364, label: "Pond bank" },
        { y: 750, label: "Pond bank" },
      ].map((item, i) => (
        <g key={`pond-bank-${i}`} className="pointer-events-none">
          <rect x="450" y={item.y - 17} width="100" height="22" rx="8" fill="#fff" opacity="0.85" />
          <text
            x="500"
            y={item.y}
            textAnchor="middle"
            fill="#0f4a63"
            fontSize="13"
            fontWeight="700"
          >
            {item.label}
          </text>
        </g>
      ))}

      {is3D && (
        <g opacity="0.8" className="pointer-events-none">
          {[
            [110, 700],
            [900, 700],
            [110, 300],
            [900, 300],
            [500, 950],
          ].map(([x, y], i) => (
            <g key={`tree-${i}`}>
              <circle cx={x} cy={y} r="20" fill="#2f7d4f" opacity="0.35" />
              <circle cx={x} cy={(y ?? 0) - 6} r="15" fill="#3d9a63" opacity="0.8" />
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}

export function RealCampusMap({
  onSelectBuilding,
}: {
  onSelectBuilding?: (buildingId: string) => void;
}) {
  const [selected, setSelected] = useState<Area | null>(null);
  const [is3D, setIs3D] = useState(true);

  return (
    <div className="px-3 pb-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="inline-flex rounded-full bg-muted p-0.5">
          <button
            type="button"
            onClick={() => setIs3D(true)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors",
              is3D ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            <Box className="size-3.5" /> 3D Model
          </button>
          <button
            type="button"
            onClick={() => setIs3D(false)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors",
              !is3D ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            <MapIcon className="size-3.5" /> 2D Plan
          </button>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
          <Trees className="size-3" /> Ground Floor
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-[#f4f2ea]">
        <div
          className={cn(
            "transition-transform duration-500",
            is3D && "[transform:perspective(1400px)_rotateX(34deg)_rotateZ(-8deg)_scale(0.93)]",
          )}
        >
          <PlanSvg selected={selected} onSelect={setSelected} is3D={is3D} />
        </div>
      </div>

      {selected && (
        <div className="mt-2 rounded-2xl border border-primary/20 bg-primary-soft/60 p-3">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{selected.label}</p>
              <p className="font-bangla text-xs text-muted-foreground">{selected.labelBn}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{selected.detail}</p>
              {selected.floors ? (
                <p className="mt-0.5 text-[10px] font-semibold text-primary">
                  {selected.floors} storey building
                </p>
              ) : null}
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

      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        Rajshahi Govt. Polytechnic Institute · official site plan · tap a building
      </p>
    </div>
  );
}
