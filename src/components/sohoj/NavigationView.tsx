import {
  ArrowLeft,
  CalendarClock,
  ChevronRight,
  DoorOpen,
  Footprints,
  LogIn,
  MoveUpRight,
  Timer,
  Navigation,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloorPlan } from "./FloorPlan";
import { CampusMap } from "./CampusMap";
import { CATEGORY_ICON, CATEGORY_TONE } from "./category-icon";
import { formatRoomCode, type RoutineEntry } from "@/lib/routine";
import {
  buildRoute,
  CATEGORY_META,
  floorLabel,
  type Building,
  type CampusLocation,
  type RouteStep,
  type StartPoint,
} from "@/lib/campus-data";
import { cn } from "@/lib/utils";

const STEP_ICON: Record<RouteStep["kind"], typeof Footprints> = {
  walk: Footprints,
  enter: LogIn,
  stairs: MoveUpRight,
  turn: Navigation,
  arrive: DoorOpen,
};

interface Props {
  location: CampusLocation;
  start: StartPoint;
  buildings: Building[];
  showCampusMap?: boolean;
  roomClasses?: RoutineEntry[];
  liveClasses?: RoutineEntry[];
  onBack: () => void;
}

export function NavigationView({
  location,
  start,
  buildings,
  showCampusMap,
  roomClasses = [],
  liveClasses = [],
  onBack,
}: Props) {
  const route = buildRoute(start, location, buildings);
  const building = buildings.find((b) => b.id === location.buildingId);
  const Icon = CATEGORY_ICON[location.category];

  return (
    <div className="animate-rise space-y-5">
      <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 text-muted-foreground">
        <ArrowLeft /> Back to search
      </Button>

      {/* Destination summary */}
      <section className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "grid size-12 shrink-0 place-items-center rounded-2xl",
              CATEGORY_TONE[location.category],
            )}
          >
            <Icon className="size-6" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {CATEGORY_META[location.category].label} · {building?.name}
            </p>
            <h2 className="mt-0.5 text-xl font-semibold leading-tight">{location.name}</h2>
            {location.nameBn && (
              <p className="font-bangla text-sm text-muted-foreground">{location.nameBn}</p>
            )}
            {formatRoomCode(location.name) && (
              <p className="mt-1 inline-flex rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary">
                {formatRoomCode(location.name)}
              </p>
            )}
          </div>
        </div>

        {/* Breadcrumb */}
        <ol
          className="mt-4 flex flex-wrap items-center gap-1 text-xs font-medium"
          aria-label="Route"
        >
          {route.breadcrumb.map((crumb, i) => {
            const last = i === route.breadcrumb.length - 1;
            return (
              <li key={i} className="flex items-center gap-1">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1",
                    i === 0 && "bg-primary text-primary-foreground",
                    last && "bg-emerald text-emerald-foreground",
                    !last && i !== 0 && "bg-primary-soft text-primary",
                  )}
                >
                  {crumb}
                </span>
                {!last && <ChevronRight className="size-3.5 text-muted-foreground" />}
              </li>
            );
          })}
        </ol>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 rounded-2xl bg-muted px-3 py-2.5">
            <Footprints className="size-4 text-primary" />
            <div>
              <p className="text-sm font-semibold">{route.walkingSteps} steps</p>
              <p className="text-[11px] text-muted-foreground">walking</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl bg-muted px-3 py-2.5">
            <Timer className="size-4 text-emerald" />
            <div>
              <p className="text-sm font-semibold">
                {route.minutes} {route.minutes === 1 ? "min" : "mins"}
              </p>
              <p className="text-[11px] text-muted-foreground">{floorLabel(location.floor)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section>
        <h3 className="mb-3 flex items-baseline justify-between text-base font-semibold">
          Step-by-step directions
          <span className="font-bangla text-sm font-normal text-muted-foreground">
            ধাপে ধাপে পথ
          </span>
        </h3>
        <ol className="relative space-y-3">
          <span
            className="absolute bottom-6 left-[1.4rem] top-6 w-0.5 bg-border"
            aria-hidden="true"
          />
          {route.steps.map((step, i) => {
            const StepIcon = STEP_ICON[step.kind];
            const last = i === route.steps.length - 1;
            return (
              <li
                key={i}
                className="animate-rise relative flex gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-[var(--shadow-card)]"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span
                  className={cn(
                    "relative z-10 grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold",
                    last
                      ? "bg-emerald text-emerald-foreground"
                      : "bg-primary text-primary-foreground",
                  )}
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <StepIcon className="size-3.5" /> Step {i + 1} · {step.title}
                    <span className="font-bangla normal-case tracking-normal">
                      ({step.titleBn})
                    </span>
                  </p>
                  <p className="mt-1 text-sm leading-relaxed">{step.detail}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {showCampusMap && (
        <CampusMap
          title="Your route on campus"
          highlightBuildingId={location.buildingId}
          startId={start.id}
        />
      )}

      {(liveClasses.length > 0 || roomClasses.length > 0) && (
        <section className="rounded-3xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <CalendarClock className="size-4 text-primary" /> Classes in this room
          </h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            routine থেকে অটো — room number {location.name.replace(/^Room\s*/i, "")}
          </p>

          {liveClasses.length > 0 && (
            <div className="mt-3 rounded-2xl border border-emerald/40 bg-emerald-soft p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald">
                <span className="size-2 animate-pulse rounded-full bg-emerald" /> Happening now
              </p>
              {liveClasses.map((e) => (
                <div key={e.id} className="mt-2">
                  <p className="text-sm font-semibold leading-tight">{e.subject}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-emerald">
                    <UserRound className="size-3.5" /> {e.teacher}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {e.day} · Period {e.period}
                    {e.endPeriod > e.period ? `–${e.endPeriod}` : ""} · Room {e.room}
                  </p>
                </div>
              ))}
            </div>
          )}

          <p className="mt-3 text-[11px] font-semibold text-muted-foreground">Full week schedule</p>
          <ul className="mt-1.5 space-y-1.5">
            {roomClasses.map((e) => (
              <li
                key={e.id}
                className="flex items-center gap-2 rounded-xl bg-muted/60 px-2.5 py-2 text-xs"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-[10px] font-bold text-primary">
                  {e.acronym}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{e.subject}</span>
                  <span className="mt-0.5 flex items-center gap-1 truncate text-[10px] font-medium text-primary">
                    <UserRound className="size-3 shrink-0" /> {e.teacher}
                  </span>
                </span>
                <span className="shrink-0 text-[10px] font-semibold text-muted-foreground">
                  {e.day.slice(0, 3)} · P{e.period}
                  {e.endPeriod > e.period ? `-${e.endPeriod}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <FloorPlan location={location} />
    </div>
  );
}
