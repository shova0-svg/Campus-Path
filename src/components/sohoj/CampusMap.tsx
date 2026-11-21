import { useState } from "react";
import { RealCampusMap } from "./RealCampusMap";
import { ExternalLink, Layers, Map as MapIcon, Satellite } from "lucide-react";
import { MAP_FEATURE_META, type CampusMapData, type StartPointId } from "@/lib/campus-data";
import { RPI_GOOGLE_MAPS_URL, RPI_SATELLITE_EMBED } from "@/lib/campus-map";
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

export function CampusMap({
  map,
  instituteName,
  highlightBuildingId,
  startId,
  onSelectBuilding,
  title,
}: Props) {
  const [view, setView] = useState<"live" | "real" | "satellite">(map ? "real" : "real");
  const [labelsOn, setLabelsOn] = useState(true);

  return (
    <figure className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]">
      <figcaption className="px-4 pb-2 pt-3.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{title ?? instituteName ?? "Campus Map"}</p>
          <p className="font-bangla text-xs text-muted-foreground">
            ক্যাম্পাস ম্যাপ — রাস্তা, ভবন, পুকুর, মাঠ
          </p>
        </div>
        <div
          className="mt-2 flex gap-1 overflow-x-auto rounded-full bg-muted p-0.5 [scrollbar-width:none]"
          role="tablist"
          aria-label="Map view"
        >
          {(
            [
              ...(map ? ([["live", Layers, "Google Map"]] as const) : []),
              ["real", MapIcon, "Real Map"],
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
                "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                view === id ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              <Icon className="size-3.5" /> {label}
            </button>
          ))}
        </div>
      </figcaption>

      {view === "real" ? (
        <RealCampusMap {...(onSelectBuilding ? { onSelectBuilding } : {})} />
      ) : view === "live" && map ? (
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
