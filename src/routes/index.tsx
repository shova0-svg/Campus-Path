import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  List,
  Loader2,
  LocateFixed,
  Map,
  MapPinPlus,
  QrCode,
  Search,
  SearchX,
  ShieldCheck,
  Sparkles,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
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
import { BrandLogo } from "@/components/sohoj/BrandLogo";
import { QrScannerDialog } from "@/components/sohoj/QrScannerDialog";
import { LocationFormDialog, type EditTarget } from "@/components/sohoj/LocationFormDialog";
import { AdminLoginDialog } from "@/components/sohoj/AdminLoginDialog";
import { AdminPanel } from "@/components/sohoj/AdminPanel";
import {
  addInstituteAdmin,
  adminProfile,
  ADMIN_SESSION_KEY,
  ADMINS_STORE_KEY,
  defaultStore,
  deleteLocation,
  isAdmin as isAdminUser,
  isAdminEmail,
  LEGACY_CUSTOM_KEY,
  loadAdmins,
  parseStore,
  removeInstituteAdmin,
  STORE_KEY,
  upsertLocation,
  type AdminAccount,
  type LocationStore,
} from "@/lib/admin";
import { NavigationView } from "@/components/sohoj/NavigationView";
import { CampusMap } from "@/components/sohoj/CampusMap";
import { RoutineView } from "@/components/sohoj/RoutineView";
import { hasCampusMap } from "@/lib/campus-map";
import {
  classesInRoom,
  deleteRoutine,
  parseRoutineStore,
  ROUTINE_STORE_KEY,
  roomsFromRoutine,
  upsertRoutine,
  type ClassRoutine,
} from "@/lib/routine";
import { CATEGORY_ICON, CATEGORY_TONE } from "@/components/sohoj/category-icon";
import {
  ALL_START_POINTS,
  CATEGORY_META,
  floorLabel,
  groupInstitutes,
  INSTITUTES,
  MAIN_GATE,
  QR_START_POINT,
  START_POINTS,
  searchLocations,
  type CampusLocation,
  type Category,
  type CategoryFilter,
  type StartPointId,
} from "@/lib/campus-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sohoj Rasta (সহজ রাস্তা) — Smart Campus Navigator" },
      {
        name: "description",
        content:
          "Find any classroom, lab or office in Bangladesh polytechnic campuses with step-by-step directions, QR checkpoints and offline maps.",
      },
      { property: "og:title", content: "Sohoj Rasta (সহজ রাস্তা) — Smart Campus Navigator" },
      {
        property: "og:description",
        content: "নতুন ক্যাম্পাসে আপনার বিশ্বস্ত গাইড — rooms, labs and offices found in seconds.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const FILTERS: { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "All" },
  ...(Object.keys(CATEGORY_META) as Category[]).map((c) => ({
    id: c,
    label: CATEGORY_META[c].label,
  })),
];

const INSTITUTE_GROUPS = groupInstitutes(INSTITUTES);

function Index() {
  const [instituteId, setInstituteId] = useState(INSTITUTES[0].id);
  const [store, setStore] = useState<LocationStore>(() => defaultStore());
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [formInstituteId, setFormInstituteId] = useState<string>(INSTITUTES[0].id);
  const [startId, setStartId] = useState<StartPointId>("main-gate");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [view, setView] = useState<"list" | "routine" | "map">("list");
  const [admins, setAdmins] = useState<AdminAccount[]>(() => loadAdmins(null));
  const [routines, setRoutines] = useState<ClassRoutine[]>(() => parseRoutineStore(null));
  const [activeRoutineId, setActiveRoutineId] = useState<string | null>(null);

  useEffect(() => {
    try {
      setStore(
        parseStore(
          window.localStorage.getItem(STORE_KEY),
          window.localStorage.getItem(LEGACY_CUSTOM_KEY),
        ),
      );
      const savedAdmins = loadAdmins(window.localStorage.getItem(ADMINS_STORE_KEY));
      setAdmins(savedAdmins);
      setRoutines(parseRoutineStore(window.localStorage.getItem(ROUTINE_STORE_KEY)));
      const session = window.localStorage.getItem(ADMIN_SESSION_KEY);
      if (isAdminUser(session, savedAdmins)) {
        setAdminEmail(session);
        const profile = adminProfile(session, savedAdmins);
        if (profile && profile.instituteId !== "all") {
          setInstituteId(profile.instituteId);
          setFormInstituteId(profile.instituteId);
        }
      }
    } catch {
      /* ignore broken storage */
    }
  }, []);

  const institute = INSTITUTES.find((i) => i.id === instituteId) ?? INSTITUTES[0];
  const locations = useMemo(() => store[institute.id] ?? institute.locations, [store, institute]);
  const profile = adminProfile(adminEmail, admins);
  const isAdmin = isAdminUser(adminEmail, admins);
  const isSuper = isAdminEmail(adminEmail);
  const allowedInstituteIds =
    profile?.instituteId === "all"
      ? INSTITUTES.map((i) => i.id)
      : profile
        ? [profile.instituteId]
        : [];
  const visibleInstitutes =
    isSuper || !profile ? INSTITUTES : INSTITUTES.filter((i) => allowedInstituteIds.includes(i.id));
  const instituteRoutines = routines.filter((r) => r.instituteId === institute.id);
  const activeRoutine =
    instituteRoutines.find((r) => r.id === activeRoutineId) ?? instituteRoutines[0];
  const results = useMemo(
    () => searchLocations(locations, institute.buildings, query, filter),
    [locations, institute.buildings, query, filter],
  );
  const selected = locations.find((l) => l.id === selectedId) ?? null;
  const start = ALL_START_POINTS.find((s) => s.id === startId) ?? MAIN_GATE;
  const startOptions =
    startId === QR_START_POINT.id ? [...START_POINTS, QR_START_POINT] : START_POINTS;

  function changeInstitute(id: string) {
    setInstituteId(id);
    setView("list");
    setSelectedId(null);
    setQuery("");
    setFilter("all");
    setDownloading(true);
    setTimeout(() => setDownloading(false), 900);
  }

  function commit(next: LocationStore) {
    setStore(next);
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch {
      /* storage full or blocked */
    }
  }

  function saveLocation(targetInstituteId: string, loc: CampusLocation) {
    if (!isAdmin) return;
    const isEdit = editing !== null;
    commit(upsertLocation(store, targetInstituteId, loc));
    toast.success(isEdit ? `${loc.name} updated` : `${loc.name} added to the map`, {
      description: "এখন সার্চে দেখা যাবে",
    });
    setEditing(null);
  }

  function removeLocation(targetInstituteId: string, loc: CampusLocation) {
    if (!isAdmin) return;
    commit(deleteLocation(store, targetInstituteId, loc.id));
    if (selectedId === loc.id) setSelectedId(null);
    toast.success(`${loc.name} deleted`);
  }

  function saveRoutine(routine: ClassRoutine) {
    if (!isAdmin) return;
    setRoutines((prev) => {
      const next = upsertRoutine(prev, routine);
      try {
        window.localStorage.setItem(ROUTINE_STORE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
    const autoRooms = roomsFromRoutine(routine, routine.instituteId);
    let nextStore = store;
    for (const room of autoRooms) {
      if (!(nextStore[routine.instituteId] ?? []).some((l) => l.id === room.id)) {
        nextStore = upsertLocation(nextStore, routine.instituteId, room);
      }
    }
    commit(nextStore);
    toast.success("Routine saved", {
      description: `${autoRooms.length} ta room auto create hoyeche`,
    });
  }

  function removeRoutine(id: string) {
    setRoutines((prev) => {
      const next = deleteRoutine(prev, id);
      try {
        window.localStorage.setItem(ROUTINE_STORE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
    toast.success("Routine deleted");
  }

  function addAdmin(email: string, instituteId: string) {
    if (!isSuper || !adminEmail) return;
    const result = addInstituteAdmin(admins, email, instituteId, adminEmail);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setAdmins(result.accounts);
    try {
      window.localStorage.setItem(ADMINS_STORE_KEY, JSON.stringify(result.accounts));
    } catch {
      /* ignore */
    }
    toast.success(`${email} added`, { description: "Ekhon ei institute access pabe" });
  }

  function removeAdmin(email: string) {
    if (!isSuper) return;
    const next = removeInstituteAdmin(admins, email);
    setAdmins(next);
    try {
      window.localStorage.setItem(ADMINS_STORE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    toast.success(`${email} removed`);
  }

  function openAdmin() {
    if (isAdmin) setPanelOpen(true);
    else setLoginOpen(true);
  }

  function handleLogin(email: string) {
    if (!isAdminUser(email, admins)) {
      toast.error("Not an admin", { description: "Super admin ei email ke admin banate hobe." });
      return;
    }
    const logged = adminProfile(email, admins);
    setAdminEmail(email);
    if (logged && logged.instituteId !== "all") {
      setInstituteId(logged.instituteId);
      setFormInstituteId(logged.instituteId);
      setView("list");
    }
    try {
      window.localStorage.setItem(ADMIN_SESSION_KEY, email);
    } catch {
      /* ignore */
    }
    toast.success("Admin Mode unlocked", { description: email });
    setPanelOpen(true);
  }

  function handleLogout() {
    setAdminEmail(null);
    setPanelOpen(false);
    try {
      window.localStorage.removeItem(ADMIN_SESSION_KEY);
    } catch {
      /* ignore */
    }
    toast("Logged out of Admin Mode");
  }

  function openAddForm(targetInstituteId: string) {
    setEditing(null);
    setFormInstituteId(targetInstituteId);
    setFormOpen(true);
  }

  function openEditForm(targetInstituteId: string, loc: CampusLocation) {
    setEditing({ instituteId: targetInstituteId, location: loc });
    setFormInstituteId(targetInstituteId);
    setFormOpen(true);
  }

  const handleQrDetected = useCallback(() => {
    setStartId(QR_START_POINT.id);
    toast.success("Location found: Academic Building Entrance", {
      description: "আপনার বর্তমান অবস্থান সেট করা হয়েছে",
    });
  }, []);

  function openLocation(id: string) {
    setSelectedId(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="bg-desk min-h-screen lg:flex lg:items-start lg:justify-center lg:gap-16 lg:px-10 lg:py-10">
      {/* Desktop pitch panel */}
      <aside className="hidden max-w-sm pt-16 lg:block">
        <BrandLogo className="size-14" />
        <h1 className="mt-6 text-4xl font-bold leading-tight text-primary">
          Every room,
          <br />
          one <span className="text-emerald">sohoj</span> path.
        </h1>
        <p className="mt-4 font-bangla text-lg text-muted-foreground">
          বাংলাদেশের পলিটেকনিক শিক্ষার্থীদের জন্য স্মার্ট ক্যাম্পাস নেভিগেশন।
        </p>
        <ul className="mt-8 space-y-3 text-sm text-foreground">
          {[
            [WifiOff, "Works offline, no GPS needed"],
            [QrCode, "QR checkpoints find where you stand"],
            [MapPinPlus, "Rooms verified by the campus admin"],
          ].map(([Icon, text]) => {
            const I = Icon as typeof WifiOff;
            return (
              <li key={text as string} className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-card text-primary shadow-[var(--shadow-card)]">
                  <I className="size-4" />
                </span>
                {text as string}
              </li>
            );
          })}
        </ul>
      </aside>

      {/* App frame */}
      <main className="mx-auto min-h-screen w-full max-w-md bg-background lg:mx-0 lg:min-h-[calc(100vh-5rem)] lg:overflow-hidden lg:rounded-[2.5rem] lg:border lg:border-border lg:shadow-[var(--shadow-float)]">
        {/* Header */}
        <header className="bg-hero rounded-b-[2rem] px-5 pb-14 pt-6 text-primary-foreground">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <BrandLogo />
              <div>
                <h1 className="text-lg font-bold leading-tight">
                  Sohoj Rasta <span className="font-bangla font-semibold">(সহজ রাস্তা)</span>
                </h1>
                <p className="font-bangla text-xs text-primary-foreground/75">
                  নতুন ক্যাম্পাসে আপনার বিশ্বস্ত গাইড
                </p>
              </div>
            </div>
            <Button
              variant="glass"
              size="sm"
              onClick={openAdmin}
              aria-label={isAdmin ? "Open admin panel" : "Admin login"}
            >
              <ShieldCheck className={isAdmin ? "text-emerald" : undefined} /> Admin
            </Button>
          </div>

          <div className="mt-5">
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-primary-foreground/70">
              Your institute
            </label>
            <Select value={instituteId} onValueChange={changeInstitute}>
              <SelectTrigger className="h-12 rounded-2xl border-primary-foreground/20 bg-primary-foreground/10 text-left text-primary-foreground [&_svg]:text-primary-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(isSuper || !profile ? INSTITUTE_GROUPS : groupInstitutes(visibleInstitutes)).map(
                  (group) => (
                    <SelectGroup key={group.id}>
                      <SelectLabel>{group.label}</SelectLabel>
                      {group.items.map((i) => (
                        <SelectItem key={i.id} value={i.id}>
                          {i.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ),
                )}
              </SelectContent>
            </Select>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="font-bangla text-primary-foreground/75">{institute.nameBn}</span>
              {downloading ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-foreground/15 px-2.5 py-1 font-medium">
                  <Loader2 className="size-3.5 animate-spin" /> Downloading map…
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald px-2.5 py-1 font-medium text-emerald-foreground">
                  <CheckCircle2 className="size-3.5" /> Offline Data Downloaded ✓
                </span>
              )}
            </div>
          </div>
        </header>

        <div className="-mt-9 space-y-5 px-4 pb-10">
          {/* Current location */}
          <section className="rounded-3xl border border-border bg-card p-4 shadow-[var(--shadow-float)]">
            <div className="flex items-baseline justify-between">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <LocateFixed className="size-4 text-emerald" /> Where are you now?
              </p>
              <span className="font-bangla text-xs text-muted-foreground">আপনি এখন কোথায়?</span>
            </div>
            <div className="mt-3 flex gap-2">
              <Select value={startId} onValueChange={(v) => setStartId(v as StartPointId)}>
                <SelectTrigger
                  className="h-12 min-w-0 flex-1 rounded-2xl bg-muted/60 text-left"
                  aria-label="Current location"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {startOptions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="emerald"
                size="xl"
                onClick={() => setQrOpen(true)}
                className="shrink-0 px-4"
              >
                <QrCode /> Scan QR
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Scan QR Checkpoint at building entrances or stairs for an exact start point.
            </p>
          </section>

          {(institute.map || instituteRoutines.length > 0) && (
            <div
              className={cn(
                "grid gap-1 rounded-2xl border border-border bg-card p-1 shadow-[var(--shadow-card)]",
                institute.map && instituteRoutines.length > 0 ? "grid-cols-3" : "grid-cols-2",
              )}
              role="tablist"
              aria-label="Campus view"
            >
              <button
                type="button"
                role="tab"
                aria-selected={view === "list"}
                onClick={() => setView("list")}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-xl px-1 py-2.5 text-xs font-semibold transition-all sm:text-sm",
                  view === "list"
                    ? "bg-primary text-primary-foreground shadow-[var(--shadow-card)]"
                    : "text-muted-foreground",
                )}
              >
                <List className="size-4" /> Destinations
              </button>
              {instituteRoutines.length > 0 && (
                <button
                  type="button"
                  role="tab"
                  aria-selected={view === "routine"}
                  onClick={() => {
                    setSelectedId(null);
                    setView("routine");
                  }}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-xl px-1 py-2.5 text-xs font-semibold transition-all sm:text-sm",
                    view === "routine"
                      ? "bg-primary text-primary-foreground shadow-[var(--shadow-card)]"
                      : "text-muted-foreground",
                  )}
                >
                  <BookOpen className="size-4" /> Class Routine
                </button>
              )}
              {institute.map && (
                <button
                  type="button"
                  role="tab"
                  aria-selected={view === "map"}
                  onClick={() => {
                    setSelectedId(null);
                    setView("map");
                  }}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-xl px-1 py-2.5 text-xs font-semibold transition-all sm:text-sm",
                    view === "map"
                      ? "bg-primary text-primary-foreground shadow-[var(--shadow-card)]"
                      : "text-muted-foreground",
                  )}
                >
                  <Map className="size-4" /> Campus Map
                </button>
              )}
            </div>
          )}

          {selected ? (
            <NavigationView
              location={selected}
              start={start}
              buildings={institute.buildings}
              showCampusMap={hasCampusMap(institute.id)}
              roomClasses={classesInRoom(routines, selected.name)}
              onBack={() => setSelectedId(null)}
            />
          ) : view === "routine" && activeRoutine ? (
            <div className="space-y-3">
              {instituteRoutines.length > 1 && (
                <Select value={activeRoutine.id} onValueChange={setActiveRoutineId}>
                  <SelectTrigger className="h-11 rounded-2xl" aria-label="Choose routine">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {instituteRoutines.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <RoutineView
                routine={activeRoutine}
                onSelectRoom={(room) => {
                  const found = locations.find(
                    (l) => l.name === `Room ${room}` || l.id.endsWith(`-${room}-${institute.id}`),
                  );
                  if (found) openLocation(found.id);
                  else
                    toast("Room not in list yet", {
                      description: "Admin panel-e routine save korle room auto create hobey.",
                    });
                }}
              />
            </div>
          ) : view === "map" && institute.map ? (
            <CampusMap
              map={institute.map}
              instituteName={institute.name}
              onSelectBuilding={(id) => {
                const b = institute.buildings.find((x) => x.id === id);
                if (b) {
                  setFilter("all");
                  setQuery(b.name);
                  setView("list");
                }
              }}
            />
          ) : (
            <>
              {/* Search */}
              <section className="space-y-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search room 205, Computer Lab, উপবৃত্তি…"
                    aria-label="Search destinations"
                    className="h-13 rounded-2xl border-border bg-card pl-12 text-base shadow-[var(--shadow-card)] focus-visible:shadow-[var(--shadow-glow)]"
                  />
                </div>
                <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
                  {FILTERS.map((f) => (
                    <Button
                      key={f.id}
                      size="sm"
                      variant={filter === f.id ? "pillActive" : "pill"}
                      onClick={() => setFilter(f.id)}
                      className="h-9 px-4"
                    >
                      {f.label}
                    </Button>
                  ))}
                </div>
              </section>

              {/* Results */}
              <section>
                <div className="mb-2 flex items-baseline justify-between px-1">
                  <h2 className="text-base font-semibold">Destinations</h2>
                  <span className="text-xs text-muted-foreground">{results.length} found</span>
                </div>
                {results.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center">
                    <SearchX className="mx-auto size-8 text-muted-foreground" />
                    <p className="mt-3 font-medium">
                      {query ? `No place matches "${query}"` : "No rooms added yet"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {query
                        ? "Try another name, or ask your campus admin to add it."
                        : "আপনার ক্যাম্পাস অ্যাডমিন Admin Mode থেকে রুম যোগ করতে পারবেন।"}
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-2.5">
                    {results.map((loc, i) => {
                      const Icon = CATEGORY_ICON[loc.category];
                      const building = institute.buildings.find((b) => b.id === loc.buildingId);
                      return (
                        <li
                          key={loc.id}
                          className="animate-rise"
                          style={{ animationDelay: `${i * 40}ms` }}
                        >
                          <button
                            type="button"
                            onClick={() => openLocation(loc.id)}
                            className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-left shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-primary/30 active:scale-[0.99]"
                          >
                            <span
                              className={cn(
                                "grid size-11 shrink-0 place-items-center rounded-xl",
                                CATEGORY_TONE[loc.category],
                              )}
                            >
                              <Icon className="size-5" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-2">
                                <span className="truncate font-semibold">{loc.name}</span>
                                {loc.custom && (
                                  <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-soft px-2 py-0.5 text-[10px] font-semibold text-emerald">
                                    <Sparkles className="size-3" /> New
                                  </span>
                                )}
                              </span>
                              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                {building?.name} · {floorLabel(loc.floor)}
                              </span>
                            </span>
                            <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </>
          )}

          {/* Ambassador CTA */}
          <section className="rounded-3xl bg-primary-soft p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Verified by the campus admin
            </p>
            <p className="mt-1 font-bangla text-sm text-foreground">
              সব রুম ও ম্যাপ অ্যাডমিন যাচাই করে যোগ করেন, তাই পথ সবসময় সঠিক থাকে।
            </p>
            {isAdmin && (
              <Button
                variant="default"
                size="xl"
                className="mt-4 w-full"
                onClick={() => setPanelOpen(true)}
              >
                <ShieldCheck /> Open Admin Panel
              </Button>
            )}
          </section>

          <p className="text-center text-[11px] text-muted-foreground">
            Sohoj Rasta · Made for Bangladesh polytechnic students
          </p>
        </div>
      </main>

      <QrScannerDialog open={qrOpen} onOpenChange={setQrOpen} onDetected={handleQrDetected} />
      <AdminLoginDialog open={loginOpen} onOpenChange={setLoginOpen} onSuccess={handleLogin} />
      {isAdmin && adminEmail && (
        <>
          <AdminPanel
            open={panelOpen}
            onOpenChange={setPanelOpen}
            email={adminEmail}
            store={store}
            currentInstituteId={institute.id}
            isSuper={isSuper}
            allowedInstituteIds={allowedInstituteIds}
            admins={admins}
            routines={routines}
            onLogout={handleLogout}
            onAdd={openAddForm}
            onEdit={openEditForm}
            onDelete={removeLocation}
            onSaveRoutine={saveRoutine}
            onDeleteRoutine={removeRoutine}
            onAddAdmin={addAdmin}
            onRemoveAdmin={removeAdmin}
          />
          <LocationFormDialog
            open={formOpen}
            onOpenChange={(o) => {
              setFormOpen(o);
              if (!o) setEditing(null);
            }}
            defaultInstituteId={formInstituteId}
            editing={editing}
            onSave={saveLocation}
          />
        </>
      )}
    </div>
  );
}
