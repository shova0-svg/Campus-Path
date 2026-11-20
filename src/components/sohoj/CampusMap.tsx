import { useState } from "react";
import { ExternalLink, Layers, Map as MapIcon, Satellite } from "lucide-react";
import { MAP_FEATURE_META, type CampusMapData, type StartPointId } from "@/lib/campus-data";
import {
  BUILDING_NODE,
  campusPath,
  MAP_EDGES,
  MAP_NODES,
  pathD,
  RPI_GOOGLE_MAPS_URL,
  RPI_SATELLITE_EMBED,
} from "@/lib/campus-map";
import { cn } from "@/lib/utils";

interface Props {
  /** Campus data for the keyless live Google Map with labelled landmarks. */
  map?: CampusMapData;
  instituteName?: string;
  /** Building to highlight (destination). */
  highlightBuildingId?: string;
  /** Start point used to draw the walking route to the highlighted building. */
  startId?: StartPointId;
  /** Called when a building on the map is tapped. */
  onSelectBuilding?: (buildingId: string) => void;
  title?: string;
}

const BUILDINGS: {
  id: string;
  label: string;
  labelBn: string;
  x: number;
  y: number;
  w: number;
  h: number;
  className: string;
  textClass: string;
}[] = [
  {
    id: "academic",
    label: "Academic Building",
    labelBn: "একাডেমিক ভবন",
    x: 120,
    y: 30,
    w: 120,
    h: 56,
    className: "fill-landmark",
    textClass: "fill-primary-foreground",
  },
  {
    id: "library",
    label: "Library",
    labelBn: "লাইব্রেরি",
    x: 34,
    y: 38,
    w: 82,
    h: 48,
    className: "fill-library",
    textClass: "fill-foreground",
  },
  {
    id: "admin",
    label: "Admin Building",
    labelBn: "প্রশাসনিক ভবন",
    x: 34,
    y: 216,
    w: 80,
    h: 38,
    className: "fill-card stroke-primary",
    textClass: "fill-primary",
  },
  {
    id: "canteen",
    label: "Canteen",
    labelBn: "ক্যান্টিন",
    x: 266,
    y: 248,
    w: 68,
    h: 34,
    className: "fill-muted-foreground",
    textClass: "fill-primary-foreground",
  },
];

export function CampusMap({
  map,
  instituteName,
  highlightBuildingId,
  startId,
  onSelectBuilding,
  title,
}: Props) {
  const [view, setView] = useState<"live" | "drawn" | "satellite">(map ? "live" : "drawn");
  const [labelsOn, setLabelsOn] = useState(true);
  const path = highlightBuildingId && startId ? campusPath(startId, highlightBuildingId) : [];
  const routeD = path.length > 1 ? pathD(path) : "";
  const startNode = path[0] ? MAP_NODES[path[0]] : null;
  const endNodeId = highlightBuildingId ? BUILDING_NODE[highlightBuildingId] : undefined;
  const endNode = endNodeId ? MAP_NODES[endNodeId] : null;

  return (
    <figure className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]">
      <figcaption className="flex items-center justify-between gap-2 px-4 pb-2 pt-3.5">
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">
            {title ?? instituteName ?? "Campus Map"}
          </span>
          <span className="block font-bangla text-xs text-muted-foreground">
            ক্যাম্পাস ম্যাপ — রাস্তা, ভবন, পুকুর, মাঠ
          </span>
        </span>
        <span
          className="flex shrink-0 rounded-full bg-muted p-0.5"
          role="tablist"
          aria-label="Map view"
        >
          {(
            [
              ...(map ? ([["live", Layers, "Google Map"]] as const) : []),
              ["drawn", MapIcon, "Map"],
              ["satellite", Satellite, "Satellite"],
            ] as const
          ).map(([id, Icon, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={view === id}
              onClick={() => setView(id)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                view === id ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              <Icon className="size-3.5" /> {label}
            </button>
          ))}
        </span>
      </figcaption>

      {view === "live" && map ? (
        <div className="px-3 pb-3">
          <div className="relative overflow-hidden rounded-2xl border border-border">
            <iframe
              title={`Google Map of ${instituteName ?? "Rajshahi Polytechnic Institute"}`}
              src={map.embedUrl}
              className="block h-72 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-card/90 px-2.5 py-1 text-[10px] font-semibold text-foreground shadow-sm backdrop-blur">
              {map.lat.toFixed(4)}, {map.lng.toFixed(4)}
            </span>
            {labelsOn && (
              <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                {map.features
                  .filter((f) => f.livePin)
                  .map((f) => (
                    <span
                      key={f.id}
                      className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-card/95 px-2 py-0.5 text-[9px] font-semibold text-foreground shadow-sm ring-1 ring-border"
                      style={{ left: `${f.x}%`, top: `${f.y}%` }}
                    >
                      <span className={cn("size-1.5 rounded-full", MAP_FEATURE_META[f.kind].dot)} />
                      {f.name}
                    </span>
                  ))}
              </div>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <button
              type="button"
              aria-pressed={labelsOn}
              onClick={() => setLabelsOn((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors",
                labelsOn ? "bg-emerald-soft text-emerald" : "bg-muted text-muted-foreground",
              )}
            >
              <Layers className="size-3" /> Campus labels {labelsOn ? "on" : "off"}
            </button>
            <a
              href={map.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
            >
              Open exact link <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      ) : view === "drawn" ? (
        <div className="px-3 pb-3">
          <svg
            viewBox="0 0 360 300"
            className="h-auto w-full"
            role="img"
            aria-label="Drawn map of Rajshahi Polytechnic Institute campus"
          >
            {/* Campus ground + boundary wall */}
            <rect
              x="4"
              y="4"
              width="352"
              height="292"
              rx="18"
              className="fill-emerald-soft stroke-primary/40"
              strokeWidth="2"
              strokeDasharray="6 4"
            />

            {/* Playground */}
            <g>
              <rect x="30" y="116" width="128" height="80" rx="8" className="fill-field" />
              <rect
                x="38"
                y="123"
                width="112"
                height="66"
                rx="4"
                className="fill-none stroke-field-line"
                strokeWidth="1.5"
              />
              <line
                x1="94"
                y1="123"
                x2="94"
                y2="189"
                className="stroke-field-line"
                strokeWidth="1.5"
              />
              <circle
                cx="94"
                cy="156"
                r="11"
                className="fill-none stroke-field-line"
                strokeWidth="1.5"
              />
              <text
                x="94"
                y="208"
                textAnchor="middle"
                className="fill-foreground text-[9px] font-semibold"
              >
                Playground · মাঠ
              </text>
            </g>

            {/* Pond */}
            <g>
              <ellipse cx="298" cy="160" rx="46" ry="34" className="fill-water" />
              <path
                d="M 276 156 q 6 -5 12 0 t 12 0 M 290 168 q 6 -5 12 0 t 12 0"
                className="fill-none stroke-card/70"
                strokeWidth="1.5"
              />
              <text
                x="298"
                y="206"
                textAnchor="middle"
                className="fill-foreground text-[9px] font-semibold"
              >
                Pond · পুকুর
              </text>
            </g>

            {/* Roads */}
            {MAP_EDGES.map(([a, b]) => (
              <line
                key={`${a}-${b}`}
                x1={MAP_NODES[a].x}
                y1={MAP_NODES[a].y}
                x2={MAP_NODES[b].x}
                y2={MAP_NODES[b].y}
                className="stroke-road"
                strokeWidth={a === "gate" || b === "top" || a === "cross" ? 12 : 8}
                strokeLinecap="round"
              />
            ))}
            {MAP_EDGES.map(([a, b]) => (
              <line
                key={`c-${a}-${b}`}
                x1={MAP_NODES[a].x}
                y1={MAP_NODES[a].y}
                x2={MAP_NODES[b].x}
                y2={MAP_NODES[b].y}
                className="stroke-card"
                strokeWidth="1"
                strokeDasharray="4 5"
              />
            ))}

            {/* Shaheed Minar */}
            <g aria-label="Shaheed Minar">
              <rect
                x="222"
                y="186"
                width="34"
                height="5"
                rx="1"
                className="fill-muted-foreground"
              />
              <circle cx="239" cy="164" r="9" className="fill-landmark" />
              <rect
                x="226"
                y="160"
                width="4"
                height="26"
                className="fill-card stroke-muted-foreground"
                strokeWidth="0.8"
              />
              <rect
                x="237"
                y="154"
                width="4"
                height="32"
                className="fill-card stroke-muted-foreground"
                strokeWidth="0.8"
              />
              <rect
                x="248"
                y="160"
                width="4"
                height="26"
                className="fill-card stroke-muted-foreground"
                strokeWidth="0.8"
              />
              <text
                x="239"
                y="202"
                textAnchor="middle"
                className="fill-foreground text-[9px] font-semibold"
              >
                Shaheed Minar
              </text>
            </g>

            {/* Buildings */}
            {BUILDINGS.map((b) => {
              const active = b.id === highlightBuildingId;
              const clickable = Boolean(onSelectBuilding);
              return (
                <g
                  key={b.id}
                  role={clickable ? "button" : undefined}
                  tabIndex={clickable ? 0 : undefined}
                  aria-label={clickable ? `Show rooms in ${b.label}` : b.label}
                  onClick={() => onSelectBuilding?.(b.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") onSelectBuilding?.(b.id);
                  }}
                  className={cn(
                    clickable &&
                      "cursor-pointer outline-none [&:focus-visible>rect]:stroke-emerald",
                  )}
                >
                  {active && (
                    <rect
                      x={b.x - 5}
                      y={b.y - 5}
                      width={b.w + 10}
                      height={b.h + 10}
                      rx="12"
                      className="fill-none stroke-emerald"
                      strokeWidth="3"
                    />
                  )}
                  <rect
                    x={b.x}
                    y={b.y}
                    width={b.w}
                    height={b.h}
                    rx="8"
                    className={b.className}
                    strokeWidth="1.5"
                  />
                  <text
                    x={b.x + b.w / 2}
                    y={b.y + b.h / 2 - 1}
                    textAnchor="middle"
                    className={cn("text-[9.5px] font-bold", b.textClass)}
                  >
                    {b.label}
                  </text>
                  <text
                    x={b.x + b.w / 2}
                    y={b.y + b.h / 2 + 11}
                    textAnchor="middle"
                    className={cn("font-bangla text-[8.5px]", b.textClass)}
                  >
                    {b.labelBn}
                  </text>
                </g>
              );
            })}

            {/* Admin flag pole */}
            <line
              x1="128"
              y1="234"
              x2="128"
              y2="254"
              className="stroke-primary"
              strokeWidth="1.5"
            />
            <rect x="128" y="234" width="10" height="6" className="fill-emerald" />

            {/* Main gate */}
            <g>
              <rect x="158" y="280" width="8" height="16" rx="2" className="fill-primary" />
              <rect x="194" y="280" width="8" height="16" rx="2" className="fill-primary" />
              <text x="226" y="292" className="fill-primary text-[9.5px] font-bold">
                Main Gate
              </text>
            </g>

            {/* Route */}
            {routeD && (
              <>
                <path
                  d={routeD}
                  className="fill-none stroke-emerald/30"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={routeD}
                  className="animate-dash fill-none stroke-emerald"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="8 6"
                />
              </>
            )}
            {startNode && routeD && (
              <g>
                <circle
                  cx={startNode.x}
                  cy={startNode.y}
                  r="7"
                  className="fill-primary stroke-card"
                  strokeWidth="2.5"
                />
                <text
                  x={startNode.x + 10}
                  y={startNode.y - 8}
                  className="fill-primary text-[9px] font-bold"
                >
                  You
                </text>
              </g>
            )}
            {endNode && (
              <g>
                <circle
                  cx={endNode.x}
                  cy={endNode.y}
                  r="7"
                  className="animate-pulse-ring fill-emerald/40"
                />
                <circle
                  cx={endNode.x}
                  cy={endNode.y}
                  r="5"
                  className="fill-emerald stroke-card"
                  strokeWidth="2"
                />
              </g>
            )}
          </svg>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-4 rounded-full bg-road" /> Road
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="size-2.5 rounded-sm bg-field" /> Ground
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="size-2.5 rounded-full bg-water" /> Pond
            </span>
            {routeD && (
              <span className="inline-flex items-center gap-1">
                <span className="h-1 w-4 rounded-full bg-emerald" /> Your route
              </span>
            )}
            {onSelectBuilding && <span className="ml-auto">Tap a building to see its rooms</span>}
          </div>
        </div>
      ) : (
        <div className="px-3 pb-3">
          <div className="overflow-hidden rounded-2xl border border-border bg-muted">
            <iframe
              title="Rajshahi Polytechnic Institute satellite map"
              src={RPI_SATELLITE_EMBED}
              className="block h-[300px] w-full"
              loading="lazy"
              referrerPolicy="no-referrer"
              allowFullScreen
            />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 px-1 text-[11px] text-muted-foreground">
            <span>Live view needs internet</span>
            <a
              href={RPI_GOOGLE_MAPS_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
            >
              Open in Google Maps <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      )}
    </figure>
  );
}
