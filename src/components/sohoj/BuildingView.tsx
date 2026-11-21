import { ArrowLeft, Building2, DoorOpen, Layers3, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { floorLabel, type Building, type CampusLocation, type Institute } from "@/lib/campus-data";
import { classesInRoom, formatRoomCode, type ClassRoutine } from "@/lib/routine";

interface Props {
  institute: Institute;
  buildings?: Building[];
  buildingId: string;
  rooms: CampusLocation[];
  routines: ClassRoutine[];
  onSelectRoom: (id: string) => void;
  onBack: () => void;
}

export function BuildingView({
  institute,
  buildings = institute.buildings,
  buildingId,
  rooms,
  routines,
  onSelectRoom,
  onBack,
}: Props) {
  const building = buildings.find((b) => b.id === buildingId);
  const buildingRooms = rooms.filter((r) => r.buildingId === buildingId);
  const floors = [...new Set(buildingRooms.map((r) => r.floor))].sort((a, b) => a - b);
  const totalClasses = buildingRooms.reduce(
    (n, r) => n + classesInRoom(routines, r.name).length,
    0,
  );

  return (
    <div className="animate-rise space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 text-muted-foreground">
        <ArrowLeft /> Back to search
      </Button>

      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="bg-hero px-5 py-5 text-primary-foreground">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald">
            <Building2 className="size-3.5" /> QR checkpoint
          </p>
          <h2 className="mt-1 text-xl font-semibold leading-tight">
            {building?.name ?? "Campus Building"}
          </h2>
          <p className="font-bangla text-sm text-primary-foreground/75">
            {institute.nameBn} · {institute.name}
          </p>
          {building?.look && (
            <p className="mt-2 text-xs text-primary-foreground/70">{building.look}</p>
          )}
        </div>
        <div className="grid grid-cols-3 divide-x divide-border text-center">
          <div className="px-2 py-3">
            <p className="text-lg font-bold text-primary">{buildingRooms.length}</p>
            <p className="text-[10px] text-muted-foreground">Rooms</p>
          </div>
          <div className="px-2 py-3">
            <p className="text-lg font-bold text-primary">{floors.length}</p>
            <p className="text-[10px] text-muted-foreground">Floors</p>
          </div>
          <div className="px-2 py-3">
            <p className="text-lg font-bold text-emerald">{totalClasses}</p>
            <p className="text-[10px] text-muted-foreground">Weekly classes</p>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-baseline justify-between px-1">
          <h3 className="text-base font-semibold">Rooms in this building</h3>
          <span className="text-xs text-muted-foreground">{buildingRooms.length} found</span>
        </div>

        {buildingRooms.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Ekhono kono room nei. Admin panel-e ei building-e room add koro.
          </div>
        ) : (
          <ul className="space-y-3">
            {buildingRooms.map((room) => {
              const classes = classesInRoom(routines, room.name);
              const teachers = [...new Map(classes.map((c) => [c.teacher, c])).values()];
              return (
                <li
                  key={room.id}
                  className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]"
                >
                  <button
                    type="button"
                    onClick={() => onSelectRoom(room.id)}
                    className="flex w-full items-center gap-3 p-3.5 text-left transition-colors hover:bg-muted/40"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                      <DoorOpen className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{room.name}</span>
                      <span className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                        <Layers3 className="size-3" />
                        {formatRoomCode(room.name) ?? floorLabel(room.floor)}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-emerald-soft px-2 py-1 text-[10px] font-bold text-emerald">
                      {classes.length} classes
                    </span>
                  </button>

                  {(classes.length > 0 || teachers.length > 0) && (
                    <div className="border-t border-border bg-muted/30 px-3.5 py-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        What happens here
                      </p>
                      {teachers.length > 0 ? (
                        <ul className="mt-1.5 space-y-1">
                          {teachers.slice(0, 4).map((c) => (
                            <li key={c.id} className="flex items-center gap-2 text-[11px]">
                              <UserRound className="size-3 shrink-0 text-primary" />
                              <span className="min-w-0 flex-1 truncate">
                                <span className="font-semibold">{c.subject}</span>
                                <span className="text-muted-foreground"> · {c.teacher}</span>
                              </span>
                              <span className="shrink-0 text-[10px] text-muted-foreground">
                                {c.day.slice(0, 3)} P{c.period}
                              </span>
                            </li>
                          ))}
                          {teachers.length > 4 && (
                            <li className="text-[10px] text-muted-foreground">
                              +{teachers.length - 4} more subjects
                            </li>
                          )}
                        </ul>
                      ) : (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Ekhono kono class assign kora hoy ni (admin panel-e routine add koro).
                        </p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
