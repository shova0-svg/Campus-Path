import { useEffect, useMemo, useState } from "react";
import {
  BellRing,
  Building2,
  BarChart3,
  LogOut,
  MessageSquare,
  Pencil,
  Plus,
  QrCode,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  UserCog,
  UserRoundCheck,
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
import { QrMaker } from "./QrMaker";
import {
  floorLabel,
  groupInstitutes,
  INSTITUTES,
  searchLocations,
  type Building,
  type CampusLocation,
  type StartPointId,
} from "@/lib/campus-data";
import { MAX_ADMINS_PER_INSTITUTE, type AdminAccount, type LocationStore } from "@/lib/admin";
import { DEFAULT_ROUTINES, sortRooms } from "@/lib/routine";
import {
  DEPARTMENT_OPTIONS,
  departmentKey,
  groupTeachers,
  teacherId,
  type Teacher,
  type TeacherStore,
} from "@/lib/teachers";
import { cn } from "@/lib/utils";
import { NoticeAdmin } from "./NoticeAdmin";
import { TeacherAccounts } from "./TeacherAccounts";
import { CrAdmin } from "./CrAdmin";
import type { NoticesApi } from "@/hooks/use-notices";
import { listFeedback, listUsageEvents, type FeedbackRow } from "@/lib/repo/feedback";
import { aggregateUsage, type UsageEvent } from "@/lib/stats";
import {
  categoryLabel,
  FEEDBACK_CATEGORIES,
  openFeedback,
  type FeedbackCategory,
} from "@/lib/feedback";

type Tab =
  | "rooms"
  | "buildings"
  | "teachers"
  | "teacherAccounts"
  | "crs"
  | "qr"
  | "notices"
  | "feedback"
  | "stats"
  | "admins";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  store: LocationStore;
  currentInstituteId: string;
  isSuper: boolean;
  allowedInstituteIds: string[];
  admins: AdminAccount[];
  buildings: Building[];
  teacherStore: TeacherStore;
  onLogout: () => void;
  onAdd: (instituteId: string) => void;
  onEdit: (instituteId: string, loc: CampusLocation) => void;
  onDelete: (instituteId: string, loc: CampusLocation) => void;
  onAddAdmin: (email: string, instituteId: string) => void;
  onRemoveAdmin: (email: string) => void;
  onSaveBuilding: (building: Building) => void;
  onDeleteBuilding: (buildingId: string) => void;
  onSaveTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (id: string) => void;
  noticesApi: NoticesApi;
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
  buildings,
  teacherStore,
  onLogout,
  onAdd,
  onEdit,
  onDelete,
  onAddAdmin,
  onRemoveAdmin,
  onSaveBuilding,
  onDeleteBuilding,
  onSaveTeacher,
  onDeleteTeacher,
  noticesApi,
}: Props) {
  const [tab, setTab] = useState<Tab>("rooms");
  const [instituteId, setInstituteId] = useState(currentInstituteId);
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<CampusLocation | null>(null);
  const [editingBuilding, setEditingBuilding] = useState<Building | "new" | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | "new" | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminInstitute, setNewAdminInstitute] = useState(allowedInstituteIds[0] ?? "rpi");
  const [feedbackRows, setFeedbackRows] = useState<FeedbackRow[]>([]);
  const [feedbackFilter, setFeedbackFilter] = useState<FeedbackCategory | "all">("all");
  const [usageEvents, setUsageEvents] = useState<UsageEvent[]>([]);
  const [statsDays, setStatsDays] = useState(7);
  const [panelLoading, setPanelLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setInstituteId(currentInstituteId);
      setTab("rooms");
      setEditingBuilding(null);
      setEditingTeacher(null);
    }
  }, [open, currentInstituteId]);

  const manageable = isSuper
    ? INSTITUTES
    : INSTITUTES.filter((i) => allowedInstituteIds.includes(i.id));
  const institute = manageable.find((i) => i.id === instituteId) ?? manageable[0] ?? INSTITUTES[0];
  useEffect(() => {
    if (!open || (tab !== "feedback" && tab !== "stats")) return;
    setPanelLoading(true);
    const load =
      tab === "feedback" ? listFeedback(institute.id) : listUsageEvents(institute.id, 30);
    void load
      .then((rows) => {
        if (tab === "feedback") setFeedbackRows(rows as FeedbackRow[]);
        else setUsageEvents(rows as UsageEvent[]);
      })
      .catch(() => {
        if (tab === "feedback") setFeedbackRows([]);
        else setUsageEvents([]);
      })
      .finally(() => setPanelLoading(false));
  }, [open, tab, institute.id]);

  const stats = useMemo(() => aggregateUsage(usageEvents, statsDays), [usageEvents, statsDays]);
  const shownFeedback = useMemo(
    () =>
      feedbackFilter === "all"
        ? feedbackRows
        : feedbackRows.filter((f) => f.category === feedbackFilter),
    [feedbackRows, feedbackFilter],
  );

  const rooms = useMemo(() => store[institute.id] ?? [], [store, institute.id]);
  const shown = useMemo(
    () => sortRooms(searchLocations(rooms, institute.buildings, query, "all")),
    [rooms, institute.buildings, query],
  );
  const instituteTeachers = teacherStore[institute.id] ?? [];

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: "rooms", label: "Rooms", icon: Pencil },
    { id: "buildings", label: "Buildings", icon: Building2 },
    { id: "teachers", label: "Teachers", icon: UserRound },
    { id: "teacherAccounts", label: "Accounts", icon: UserCog },
    ...(isSuper ? [{ id: "crs" as Tab, label: "CRs", icon: UserRoundCheck }] : []),
    { id: "qr", label: "QR", icon: QrCode },
    { id: "notices", label: "Notice", icon: BellRing },
    { id: "feedback", label: "Feedback", icon: MessageSquare },
    { id: "stats", label: "Stats", icon: BarChart3 },
    ...(isSuper ? [{ id: "admins" as Tab, label: "Admins", icon: Users }] : []),
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            "fixed left-0 top-0 flex h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none p-0",
            "sm:left-[50%] sm:top-[50%] sm:h-auto sm:max-h-[92dvh] sm:w-full sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-3xl",
            tab === "feedback" || tab === "stats" || tab === "notices"
              ? "sm:max-w-2xl lg:max-w-3xl"
              : "sm:max-w-2xl",
          )}
        >
          <div className="bg-hero px-4 pb-4 pt-[calc(1.25rem+env(safe-area-inset-top))] text-primary-foreground sm:px-5 sm:pt-5">
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

            <div className="mt-3 flex gap-1 overflow-x-auto rounded-xl bg-primary-foreground/10 p-1 [scrollbar-width:none] sm:grid sm:grid-cols-5 sm:overflow-visible [&::-webkit-scrollbar]:hidden">
              {tabs.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    title={t.id === "teacherAccounts" ? "Teacher Accounts" : t.label}
                    onClick={() => {
                      setTab(t.id);
                      setEditingBuilding(null);
                      setEditingTeacher(null);
                    }}
                    className={cn(
                      "flex min-w-0 shrink-0 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-colors sm:text-xs",
                      tab === t.id
                        ? "bg-primary-foreground text-primary"
                        : "text-primary-foreground/75",
                    )}
                  >
                    <Icon className="size-3.5 shrink-0" />
                    <span className="truncate">{t.label}</span>
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
                  <span className="truncate" title={institute.name}>
                    {institute.name}
                  </span>
                </div>
              )}
              <Button
                variant="glass"
                size="lg"
                onClick={onLogout}
                className="h-11 shrink-0"
                aria-label="Log out"
              >
                <LogOut /> <span className="hidden sm:inline">Logout</span>
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

          {tab === "buildings" && (
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {editingBuilding ? (
                <BuildingEditor
                  initial={editingBuilding === "new" ? null : editingBuilding}
                  roomCount={(id) => rooms.filter((r) => r.buildingId === id).length}
                  onSave={(b) => {
                    onSaveBuilding(b);
                    setEditingBuilding(null);
                  }}
                  onCancel={() => setEditingBuilding(null)}
                />
              ) : (
                <>
                  <Button
                    variant="emerald"
                    size="xl"
                    className="w-full"
                    onClick={() => setEditingBuilding("new")}
                  >
                    <Plus /> Add New Building
                  </Button>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Bhon add korlei tar niche classroom gulo thakbe. Room add korar somoy ei
                    building select kora jay.
                  </p>
                  <ul className="mt-3 space-y-2">
                    {buildings.map((b) => {
                      const count = rooms.filter((r) => r.buildingId === b.id).length;
                      return (
                        <li
                          key={b.id}
                          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
                        >
                          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                            <Building2 className="size-5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold">{b.name}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {count} rooms · {b.isAcademic ? "Academic" : "Other"}
                            </span>
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Edit ${b.name}`}
                            onClick={() => setEditingBuilding(b)}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Delete ${b.name}`}
                            className="text-destructive hover:text-destructive"
                            onClick={() => onDeleteBuilding(b.id)}
                          >
                            <Trash2 />
                          </Button>
                        </li>
                      );
                    })}
                    {buildings.length === 0 && (
                      <li className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                        Ekhono kono building nei.
                      </li>
                    )}
                  </ul>
                </>
              )}
            </div>
          )}

          {tab === "teachers" && (
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {editingTeacher ? (
                <TeacherEditor
                  instituteName={institute.name}
                  buildings={buildings}
                  initial={editingTeacher === "new" ? null : editingTeacher}
                  onSave={(teacher) => {
                    onSaveTeacher(teacher);
                    setEditingTeacher(null);
                  }}
                  onCancel={() => setEditingTeacher(null)}
                />
              ) : (
                <>
                  <Button
                    variant="emerald"
                    size="xl"
                    className="w-full"
                    onClick={() => setEditingTeacher("new")}
                  >
                    <Plus /> Add New Teacher
                  </Button>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Institute ও Department বেছে নিয়ে শিক্ষক যোগ করুন — Teachers page-এ দেখা যাবে।
                  </p>
                  {groupTeachers(instituteTeachers).map((group) => (
                    <div key={group.key} className="mt-4">
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                        {group.label} ({group.teachers.length})
                      </p>
                      <ul className="space-y-2">
                        {group.teachers.map((teacher) => (
                          <li
                            key={teacherId(teacher)}
                            className="flex items-center gap-2 rounded-2xl border border-border bg-card p-2.5"
                          >
                            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                              <UserRound className="size-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-xs font-semibold">
                                {teacher.name}
                              </span>
                              <span className="block truncate text-[10px] text-muted-foreground">
                                {teacher.designation || group.label}
                              </span>
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Edit ${teacher.name}`}
                              onClick={() => setEditingTeacher(teacher)}
                            >
                              <Pencil />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Delete ${teacher.name}`}
                              className="text-destructive hover:text-destructive"
                              onClick={() => onDeleteTeacher(teacherId(teacher))}
                            >
                              <Trash2 />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {tab === "teacherAccounts" && <TeacherAccounts instituteId={institute.id} />}

          {tab === "crs" && isSuper && <CrAdmin instituteId={institute.id} />}

          {tab === "qr" && (
            <QrMaker
              institute={institute}
              buildings={buildings}
              rooms={rooms}
              routines={DEFAULT_ROUTINES}
            />
          )}

          {tab === "notices" && (
            <NoticeAdmin
              sources={noticesApi.sources}
              notices={noticesApi.all}
              onSourcesChange={noticesApi.setSources}
              onAddManual={(input) => void noticesApi.addManual(input)}
              onFetchNow={() => void noticesApi.fetchSource()}
              onApprove={(id, status) => void noticesApi.approve(id, status)}
              onEdit={(id, patch) => void noticesApi.edit(id, patch)}
              onRemove={(id) => void noticesApi.remove(id)}
              loading={noticesApi.loading}
              error={noticesApi.error}
            />
          )}

          {tab === "admins" && isSuper && (
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
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
          {(tab === "feedback" || tab === "stats") && (
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {panelLoading && (
                <p className="py-6 text-center text-xs text-muted-foreground">Loading…</p>
              )}
              {!panelLoading && tab === "feedback" && (
                <>
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {(["all", ...FEEDBACK_CATEGORIES.map((c) => c.id)] as const).map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setFeedbackFilter(id)}
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                          feedbackFilter === id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {id === "all" ? "All" : categoryLabel(id).split(" / ")[0]}
                      </button>
                    ))}
                  </div>
                  {shownFeedback.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                      Ekhono kono feedback nei.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {shownFeedback.map((f) => (
                        <li key={f.id} className="rounded-2xl border border-border bg-card p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-amber-500">
                              {"★".repeat(f.rating)}
                            </span>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                              {categoryLabel(f.category).split(" / ")[0]}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-foreground">{f.message || "—"}</p>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {f.page ? `${f.page} · ` : ""}
                            {new Date(f.created_at).toLocaleString()}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
              {!panelLoading && tab === "stats" && (
                <>
                  <div className="mb-3 flex gap-1 rounded-full bg-muted p-1">
                    {[7, 30].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setStatsDays(d)}
                        className={cn(
                          "flex-1 rounded-full px-3 py-1.5 text-xs font-semibold",
                          statsDays === d
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        Last {d} days
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ["Active students", stats.activeUsers],
                      ["Events", stats.totalEvents],
                      ["QR scans", stats.qrScans],
                      ["Reminder opt-ins", stats.reminderOptIns],
                    ].map(([label, value]) => (
                      <div
                        key={label as string}
                        className="rounded-2xl border border-border bg-card p-3"
                      >
                        <p className="text-xl font-bold text-primary">{value as number}</p>
                        <p className="text-[10px] text-muted-foreground">{label as string}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-2xl border border-border bg-card p-3">
                    <p className="text-xs font-semibold">Most searched rooms</p>
                    {stats.topRooms.length === 0 ? (
                      <p className="mt-1 text-[11px] text-muted-foreground">No searches yet.</p>
                    ) : (
                      <ul className="mt-2 space-y-1">
                        {stats.topRooms.map((r) => (
                          <li key={r.room} className="flex justify-between text-xs">
                            <span>{r.room}</span>
                            <span className="font-semibold text-primary">{r.count}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="mt-3 rounded-2xl border border-border bg-card p-3">
                    <p className="text-xs font-semibold">Daily active students</p>
                    <div className="mt-2 flex h-20 items-end gap-1">
                      {stats.dailyActiveUsers.slice(-statsDays).map((d) => (
                        <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                          <div
                            className="w-full rounded-t bg-primary/70"
                            style={{
                              height: `${Math.max(4, (d.count / Math.max(1, ...stats.dailyActiveUsers.map((x) => x.count))) * 100)}%`,
                            }}
                          />
                          <span className="text-[8px] text-muted-foreground">{d.day.slice(5)}</span>
                        </div>
                      ))}
                      {stats.dailyActiveUsers.length === 0 && (
                        <p className="text-[11px] text-muted-foreground">No activity yet.</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          <div className="h-[env(safe-area-inset-bottom)] sm:hidden" aria-hidden="true" />
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

const START_POINT_IDS: StartPointId[] = [
  "main-gate",
  "shaheed-minar",
  "academic-ground",
  "academic-entrance",
];

const START_POINT_LABELS: Record<StartPointId, string> = {
  "main-gate": "Main Gate",
  "shaheed-minar": "Shaheed Minar",
  "academic-ground": "Academic ground",
  "academic-entrance": "Academic entrance",
};

function blankBuilding(): Building {
  return {
    id: `building-${Date.now()}`,
    name: "",
    look: "",
    isAcademic: false,
    distance: {
      "main-gate": 60,
      "shaheed-minar": 40,
      "academic-ground": 40,
      "academic-entrance": 40,
    },
  };
}

function BuildingEditor({
  initial,
  roomCount,
  onSave,
  onCancel,
}: {
  initial: Building | null;
  roomCount: (id: string) => number;
  onSave: (building: Building) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Building>(initial ? { ...initial } : blankBuilding());
  const patch = (p: Partial<Building>) => setDraft((d) => ({ ...d, ...p }));

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[11px] font-semibold text-muted-foreground">Building name</label>
        <Input
          value={draft.name}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="e.g. Academic Building"
          className="h-10 rounded-xl"
        />
      </div>
      <div>
        <label className="text-[11px] font-semibold text-muted-foreground">
          Look / landmark (directions-e use hobey)
        </label>
        <Input
          value={draft.look}
          onChange={(e) => patch({ look: e.target.value })}
          placeholder="Red building with the flag pole"
          className="h-10 rounded-xl"
        />
      </div>
      <label className="flex items-center gap-2 text-xs font-medium">
        <input
          type="checkbox"
          checked={draft.isAcademic}
          onChange={(e) => patch({ isAcademic: e.target.checked })}
          className="size-4 accent-[var(--primary)]"
        />
        Academic building
      </label>

      <div>
        <p className="mb-1.5 text-[11px] font-semibold text-muted-foreground">
          Walking distance (meters) from each start point
        </p>
        <div className="grid grid-cols-2 gap-2">
          {START_POINT_IDS.map((id) => (
            <div key={id}>
              <label className="text-[10px] text-muted-foreground">{START_POINT_LABELS[id]}</label>
              <Input
                type="number"
                min={0}
                value={draft.distance[id] ?? 0}
                onChange={(e) =>
                  patch({ distance: { ...draft.distance, [id]: Number(e.target.value) } })
                }
                className="h-9 rounded-lg"
              />
            </div>
          ))}
        </div>
      </div>

      {initial && (
        <p className="text-[11px] text-muted-foreground">
          {roomCount(initial.id)} rooms currently in this building.
        </p>
      )}

      <div className="flex gap-2">
        <Button
          variant="emerald"
          className="flex-1"
          disabled={!draft.name.trim()}
          onClick={() =>
            onSave({
              ...draft,
              name: draft.name.trim(),
              look: draft.look.trim() || draft.name.trim(),
            })
          }
        >
          Save building
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function TeacherEditor({
  instituteName,
  buildings,
  initial,
  onSave,
  onCancel,
}: {
  instituteName: string;
  buildings: Building[];
  initial: Teacher | null;
  onSave: (teacher: Teacher) => void;
  onCancel: () => void;
}) {
  const [department, setDepartment] = useState(
    initial?.faculty ?? DEPARTMENT_OPTIONS[0]?.label ?? "সিভিল",
  );
  const [name, setName] = useState(initial?.name ?? "");
  const [designation, setDesignation] = useState(initial?.designation ?? "ইন্সট্রাক্টর");
  const [mobile, setMobile] = useState(initial?.mobile ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [room, setRoom] = useState(initial?.room ?? "");
  const [photo, setPhoto] = useState(initial?.photo ?? "");

  const departmentNames = [
    ...new Set([...DEPARTMENT_OPTIONS.map((o) => o.label), ...buildings.map((b) => b.name)]),
  ];

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-muted/60 p-2.5 text-[11px] text-muted-foreground">
        Institute: <span className="font-semibold text-foreground">{instituteName}</span>
      </div>

      <div>
        <label className="text-[11px] font-semibold text-muted-foreground">
          Department / বিভাগ
        </label>
        <Select value={department} onValueChange={setDepartment}>
          <SelectTrigger className="h-10 rounded-xl" aria-label="Department for teacher">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {departmentNames.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-[11px] font-semibold text-muted-foreground">Name / নাম</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="মোঃ আব্দুল্লাহ"
          className="h-10 rounded-xl"
        />
      </div>
      <div>
        <label className="text-[11px] font-semibold text-muted-foreground">
          Designation / পদবি
        </label>
        <Input
          value={designation}
          onChange={(e) => setDesignation(e.target.value)}
          className="h-10 rounded-xl"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground">Mobile</label>
          <Input
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="০১৭..."
            className="h-10 rounded-xl"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground">Room</label>
          <Input
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            placeholder="1305"
            className="h-10 rounded-xl"
          />
        </div>
      </div>
      <div>
        <label className="text-[11px] font-semibold text-muted-foreground">Email</label>
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          className="h-10 rounded-xl"
        />
      </div>
      <div>
        <label className="text-[11px] font-semibold text-muted-foreground">
          Photo URL (optional)
        </label>
        <Input
          value={photo}
          onChange={(e) => setPhoto(e.target.value)}
          placeholder="https://…"
          className="h-10 rounded-xl"
        />
      </div>

      <div className="flex gap-2">
        <Button
          variant="emerald"
          className="flex-1"
          disabled={name.trim().length < 2}
          onClick={() =>
            onSave({
              ...(initial ?? {}),
              name: name.trim(),
              designation: designation.trim(),
              faculty: department,
              facultyKey: departmentKey(department),
              department,
              office: instituteName,
              mobile: mobile.trim(),
              email: email.trim(),
              room: room.trim(),
              photo: photo.trim(),
              serial: initial?.serial ?? "",
              batch: initial?.batch ?? "",
              phoneOffice: initial?.phoneOffice ?? "",
              phoneHome: initial?.phoneHome ?? "",
            })
          }
        >
          Save teacher
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
