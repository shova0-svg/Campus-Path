import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  LogOut,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_ICON, CATEGORY_TONE } from "./category-icon";
import { RoutineEditor } from "./RoutineEditor";
import {
  floorLabel,
  groupInstitutes,
  INSTITUTES,
  searchLocations,
  type CampusLocation,
} from "@/lib/campus-data";
import { MAX_ADMINS_PER_INSTITUTE, type AdminAccount, type LocationStore } from "@/lib/admin";
import type { ClassRoutine } from "@/lib/routine";
import { cn } from "@/lib/utils";

type Tab = "rooms" | "routines" | "admins";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  store: LocationStore;
  currentInstituteId: string;
  isSuper: boolean;
  allowedInstituteIds: string[];
  admins: AdminAccount[];
  routines: ClassRoutine[];
  onLogout: () => void;
  onAdd: (instituteId: string) => void;
  onEdit: (instituteId: string, loc: CampusLocation) => void;
  onDelete: (instituteId: string, loc: CampusLocation) => void;
  onSaveRoutine: (routine: ClassRoutine) => void;
  onDeleteRoutine: (id: string) => void;
  onAddAdmin: (email: string, instituteId: string) => void;
  onRemoveAdmin: (email: string) => void;
}

export function AdminPanel({
  open,
  onOpenChange,
  email,
  store,
  currentInstituteId,
  isSuper,
  allowedInstituteIds,
  admins,
  routines,
  onLogout,
  onAdd,
  onEdit,
  onDelete,
  onSaveRoutine,
  onDeleteRoutine,
  onAddAdmin,
  onRemoveAdmin,
}: Props) {
  const [tab, setTab] = useState<Tab>("rooms");
  const [instituteId, setInstituteId] = useState(currentInstituteId);
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<CampusLocation | null>(null);
  const [editingRoutine, setEditingRoutine] = useState<ClassRoutine | "new" | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminInstitute, setNewAdminInstitute] = useState(allowedInstituteIds[0] ?? "rpi");

  useEffect(() => {
    if (open) {
      setInstituteId(currentInstituteId);
      setTab("rooms");
      setEditingRoutine(null);
    }
  }, [open, currentInstituteId]);

  const manageable = isSuper
    ? INSTITUTES
    : INSTITUTES.filter((i) => allowedInstituteIds.includes(i.id));
  const institute = manageable.find((i) => i.id === instituteId) ?? manageable[0] ?? INSTITUTES[0];
  const rooms = useMemo(() => store[institute.id] ?? [], [store, institute.id]);
  const shown = useMemo(
    () => searchLocations(rooms, institute.buildings, query, "all"),
    [rooms, institute.buildings, query],
  );
  const instituteRoutines = routines.filter((r) => r.instituteId === institute.id);

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: "rooms", label: "Rooms", icon: Pencil },
    { id: "routines", label: "Routines", icon: CalendarDays },
    ...(isSuper ? [{ id: "admins" as Tab, label: "Admins", icon: Users }] : []),
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[92vh] max-w-md flex-col gap-0 overflow-hidden rounded-3xl p-0">
          <div className="bg-hero px-5 pb-4 pt-5 text-primary-foreground">
            <DialogHeader className="space-y-0 pr-6 text-left">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="size-5 text-emerald" /> Admin Panel
              </DialogTitle>
              <DialogDescription className="text-primary-foreground/80">
                <span className="break-all font-medium text-primary-foreground">{email}</span>
                <span className="ml-1.5 rounded-full bg-emerald px-2 py-0.5 text-[10px] font-bold text-emerald-foreground">
                  {isSuper ? "SUPER ADMIN" : "INSTITUTE ADMIN"}
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className="mt-3 flex gap-1 rounded-xl bg-primary-foreground/10 p-1">
              {tabs.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setTab(t.id);
                      setEditingRoutine(null);
                    }}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors",
                      tab === t.id
                        ? "bg-primary-foreground text-primary"
                        : "text-primary-foreground/75",
                    )}
                  >
                    <Icon className="size-3.5" /> {t.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex gap-2">
              {isSuper || manageable.length > 1 ? (
                <Select value={institute.id} onValueChange={setInstituteId}>
                  <SelectTrigger
                    aria-label="Institute to manage"
                    className="h-11 min-w-0 flex-1 rounded-xl border-primary-foreground/20 bg-primary-foreground/10 text-left text-primary-foreground [&_svg]:text-primary-foreground"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {groupInstitutes(manageable).map((group) => (
                      <SelectGroup key={group.id}>
                        <SelectLabel>{group.label}</SelectLabel>
                        {group.items.map((i) => (
                          <SelectItem key={i.id} value={i.id}>
                            {i.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex h-11 min-w-0 flex-1 items-center rounded-xl border border-primary-foreground/20 bg-primary-foreground/10 px-3 text-sm">
                  {institute.name}
                </div>
              )}
              <Button variant="glass" size="lg" onClick={onLogout} className="h-11 shrink-0">
                <LogOut /> Logout
              </Button>
            </div>
          </div>

          {tab === "rooms" && (
            <>
              <div className="space-y-3 border-b border-border px-5 py-4">
                <Button
                  variant="emerald"
                  size="xl"
                  className="w-full"
                  onClick={() => onAdd(institute.id)}
                >
                  <Plus /> Add New Room
                </Button>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Find a room to edit…"
                    aria-label="Find a room to edit"
                    className="h-11 rounded-xl pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {rooms.length} rooms at {institute.name}
                </p>
              </div>

              <ul className="flex-1 space-y-2 overflow-y-auto px-5 py-4">
                {shown.length === 0 && (
                  <li className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    No rooms here yet. Add one, or save a routine — rooms are created automatically.
                  </li>
                )}
                {shown.map((loc) => {
                  const Icon = CATEGORY_ICON[loc.category];
                  const building = institute.buildings.find((b) => b.id === loc.buildingId);
                  return (
                    <li
                      key={loc.id}
                      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
                    >
                      <span
                        className={cn(
                          "grid size-10 shrink-0 place-items-center rounded-xl",
                          CATEGORY_TONE[loc.category],
                        )}
                      >
                        <Icon className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{loc.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {building?.name ?? "Building"} · {floorLabel(loc.floor)}
                        </span>
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${loc.name}`}
                        onClick={() => onEdit(institute.id, loc)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${loc.name}`}
                        className="text-destructive hover:text-destructive"
                        onClick={() => setPendingDelete(loc)}
                      >
                        <Trash2 />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {tab === "routines" && (
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {editingRoutine ? (
                <RoutineEditor
                  instituteId={institute.id}
                  initial={editingRoutine === "new" ? null : editingRoutine}
                  onSave={(r) => {
                    onSaveRoutine(r);
                    setEditingRoutine(null);
                  }}
                  onDelete={(id) => {
                    onDeleteRoutine(id);
                    setEditingRoutine(null);
                  }}
                  onCancel={() => setEditingRoutine(null)}
                />
              ) : (
                <>
                  <Button
                    variant="emerald"
                    size="xl"
                    className="w-full"
                    onClick={() => setEditingRoutine("new")}
                  >
                    <Plus /> Upload / make routine
                  </Button>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Image/PDF upload ba text paste — software auto routine banabe ar room-gulo auto
                    create hobey.
                  </p>
                  <ul className="mt-3 space-y-2">
                    {instituteRoutines.map((r) => (
                      <li
                        key={r.id}
                        className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
                      >
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                          <CalendarDays className="size-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{r.title}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            Semester {r.semester} · {r.shift} · {r.entries.length} classes
                            {r.file ? ` · ${r.file}` : ""}
                          </span>
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Edit ${r.title}`}
                          onClick={() => setEditingRoutine(r)}
                        >
                          <Pencil />
                        </Button>
                      </li>
                    ))}
                    {instituteRoutines.length === 0 && (
                      <li className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                        Ekhono kono routine nei.
                      </li>
                    )}
                  </ul>
                </>
              )}
            </div>
          )}

          {tab === "admins" && isSuper && (
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <p className="text-xs text-muted-foreground">
                Per polytechnic max {MAX_ADMINS_PER_INSTITUTE} admin. Institute admin shudhu nijer
                polytechnic edit korte parbe.
              </p>
              <div className="mt-3 space-y-2 rounded-2xl border border-border bg-muted/40 p-3">
                <Input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="admin@email.com"
                  aria-label="New admin email"
                  className="h-10 rounded-xl"
                />
                <Select value={newAdminInstitute} onValueChange={setNewAdminInstitute}>
                  <SelectTrigger className="h-10 rounded-xl" aria-label="Institute for new admin">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INSTITUTES.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="emerald"
                  className="w-full"
                  onClick={() => {
                    if (!newAdminEmail.trim()) return;
                    onAddAdmin(newAdminEmail, newAdminInstitute);
                    setNewAdminEmail("");
                  }}
                >
                  <Plus /> Add admin
                </Button>
              </div>

              <ul className="mt-4 space-y-2">
                {admins.map((a) => (
                  <li
                    key={a.email}
                    className="flex items-center gap-2 rounded-2xl border border-border bg-card p-3"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                      <ShieldCheck className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold">{a.email}</span>
                      <span className="block truncate text-[10px] text-muted-foreground">
                        {a.role === "super"
                          ? "All institutes"
                          : (INSTITUTES.find((i) => i.id === a.instituteId)?.name ?? a.instituteId)}
                      </span>
                    </span>
                    {a.role !== "super" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${a.email}`}
                        onClick={() => onRemoveAdmin(a.email)}
                      >
                        <Trash2 className="text-destructive" />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={pendingDelete !== null} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent className="max-w-sm rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this room?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.name} will be removed from {institute.name} for students using this
              device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pendingDelete) onDelete(institute.id, pendingDelete);
                setPendingDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
