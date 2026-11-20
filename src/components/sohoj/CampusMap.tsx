import { useState } from "react";
import { ExternalLink, Layers, MapPinned, Navigation } from "lucide-react";
import { MAP_FEATURE_META, type CampusMapData, type MapFeature } from "@/lib/campus-data";
import { cn } from "@/lib/utils";

const W = 400;
const H = 300;
const X = (n: number) => (n / 100) * W;
const Y = (n: number) => (n / 100) * H;

interface Props {
  map: CampusMapData;
  instituteName: string;
}

export function CampusMap({ map, instituteName }: Props) {
  const [view, setView] = useState<"live" | "plan">("live");
  const [labelsOn, setLabelsOn] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  const active = map.features.find((f) => f.id === activeId) ?? null;

  return (
    <section className="animate-rise overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <MapPinned className="size-3.5" /> Campus map
          </p>
          <h2 className="mt-1 truncate text-base font-semibold">{instituteName}</h2>
          <p className="font-bangla text-xs text-muted-foreground">
            ক্যাম্পাস ম্যাপ · রাস্তা, ভবন, পুকুর ও মাঠ
          </p>
        </div>
        <a
          href={map.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
        >
          Google Maps <ExternalLink className="size-3" />
        </a>
      </div>

      {/* View switcher */}
      <div className="mx-4 mb-3 grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1">
        <button
          type="button"
          aria-pressed={view === "live"}
          onClick={() => setView("live")}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-semibold transition-all",
            view === "live"
              ? "bg-card text-primary shadow-[var(--shadow-card)]"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Navigation className="size-3.5" /> Live Google Map
        </button>
        <button
          type="button"
          aria-pressed={view === "plan"}
          onClick={() => setView("plan")}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-semibold transition-all",
            view === "plan"
              ? "bg-card text-primary shadow-[var(--shadow-card)]"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Layers className="size-3.5" /> Annotated plan
        </button>
      </div>

      {view === "live" ? (
        <>
          <div className="relative mx-4 overflow-hidden rounded-2xl border border-border">
            <iframe
              title={`Google Map of ${instituteName}`}
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
          <div className="flex items-center justify-between gap-2 px-4 py-3">
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
            <span className="text-right text-[10px] leading-tight text-muted-foreground">
              Label positions are approximate
            </span>
          </div>
        </>
      ) : (
        <>
          <div className="mx-4 overflow-hidden rounded-2xl border border-border bg-primary-soft/40">
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="h-auto w-full"
              role="img"
              aria-label={`Annotated plan of ${instituteName} showing roads, buildings, pond and ground`}
            >
              <rect x="0" y="0" width={W} height={H} className="fill-primary-soft/40" />

              {/* Roads */}
              {map.roads.map((road) => {
                const d = road.points
                  .map(([px, py], i) => `${i === 0 ? "M" : "L"} ${X(px)} ${Y(py)}`)
                  .join(" ");
                return (
                  <g key={road.id}>
                    <path
                      d={d}
                      className="stroke-border"
                      strokeWidth="9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                    <path
                      d={d}
                      className="stroke-card"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </g>
                );
              })}

              {/* Features */}
              {map.features.map((f) => (
                <FeatureShape
                  key={f.id}
                  feature={f}
                  active={activeId === f.id}
                  onSelect={() => setActiveId((id) => (id === f.id ? null : f.id))}
                />
              ))}
            </svg>
          </div>

          <div className="mx-4 mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {(Object.keys(MAP_FEATURE_META) as (keyof typeof MAP_FEATURE_META)[])
              .filter((k) => k !== "road")
              .map((k) => (
                <span key={k} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className={cn("size-2 rounded-full", MAP_FEATURE_META[k].dot)} />
                  {MAP_FEATURE_META[k].label}
                </span>
              ))}
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="h-0.5 w-3 rounded-full bg-border" /> Road
            </span>
          </div>

          <div className="mx-4 mb-4 mt-3 min-h-12 rounded-2xl bg-muted px-3 py-2.5">
            {active ? (
              <p className="text-xs leading-relaxed">
                <span className="font-semibold">{active.name}</span>
                <span className="font-bangla text-muted-foreground"> · {active.nameBn}</span>
                <span className="mt-0.5 block text-muted-foreground">{active.detail}</span>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Tap a marker on the plan to see what it is.
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}

interface ShapeProps {
  feature: MapFeature;
  active: boolean;
  onSelect: () => void;
}

function FeatureShape({ feature: f, active, onSelect }: ShapeProps) {
  const cx = X(f.x);
  const cy = Y(f.y);
  const w = ((f.size?.[0] ?? 10) / 100) * W;
  const h = ((f.size?.[1] ?? 8) / 100) * H;
  const x = cx - w / 2;
  const y = cy - h / 2;
  const isArea = Boolean(f.size);
  // Point markers (gate, landmark) keep their labels above so they don't
  // collide with area labels and shapes drawn below them.
  const labelY = isArea ? y + h + 11 : y - 6;
  const showAbove = labelY > H - 6;

  const toneClass =
    f.kind === "pond"
      ? "fill-chart-5/30 stroke-chart-5"
      : f.kind === "ground"
        ? "fill-emerald-soft stroke-emerald"
        : f.kind === "gate" || f.kind === "landmark"
          ? "fill-landmark-soft stroke-landmark"
          : "fill-card stroke-primary/40";

  const textClass =
    f.kind === "pond"
      ? "fill-chart-5"
      : f.kind === "ground"
        ? "fill-emerald"
        : f.kind === "gate" || f.kind === "landmark"
          ? "fill-landmark"
          : "fill-primary";

  return (
    <g onClick={onSelect} className="cursor-pointer" role="button" aria-label={f.name}>
      {active && (
        <rect
          x={x - 3}
          y={y - 3}
          width={w + 6}
          height={h + 6}
          rx="9"
          className="svg-pulse fill-none stroke-emerald"
          strokeWidth="3"
        />
      )}

      {f.kind === "landmark" ? (
        <polygon
          points={`${cx},${cy - h / 2} ${cx + w / 2},${cy} ${cx},${cy + h / 2} ${cx - w / 2},${cy}`}
          className={cn(toneClass, active && "stroke-emerald")}
          strokeWidth="2"
        />
      ) : f.kind === "pond" ? (
        <ellipse
          cx={cx}
          cy={cy}
          rx={w / 2}
          ry={h / 2}
          className={cn(toneClass, active && "stroke-emerald")}
          strokeWidth="2"
        />
      ) : (
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          rx="5"
          className={cn(toneClass, active && "stroke-emerald")}
          strokeWidth="2"
        />
      )}

      <g className="pointer-events-none">
        <text
          x={cx}
          y={showAbove ? y - 6 : labelY}
          textAnchor="middle"
          fontSize="9"
          fontWeight="700"
          className={textClass}
        >
          {f.name}
        </text>
        <text
          x={cx}
          y={(showAbove ? y - 6 : labelY) + 9}
          textAnchor="middle"
          fontSize="8"
          className="font-bangla fill-muted-foreground"
        >
          {f.nameBn}
        </text>
      </g>
    </g>
  );
}
