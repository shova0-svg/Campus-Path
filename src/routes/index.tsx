import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import {
  BellRing,
  BookOpen,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Flag,
  List,
  Loader2,
  LocateFixed,
  Map as MapIcon,
  MapPinPlus,
  QrCode,
  Search,
  SearchX,
  ShieldCheck,
  Sparkles,
  UserRound,
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
import { Logo } from "@/components/brand/Logo";
const QrScannerDialog = lazy(() =>
  import("@/components/sohoj/QrScannerDialog").then((m) => ({ default: m.QrScannerDialog })),
);
import type { EditTarget } from "@/components/sohoj/LocationFormDialog";
const LocationFormDialog = lazy(() =>
  import("@/components/sohoj/LocationFormDialog").then((m) => ({ default: m.LocationFormDialog })),
);
const AdminPanel = lazy(() =>
  import("@/components/sohoj/AdminPanel").then((m) => ({ default: m.AdminPanel })),
);
import {
  addInstituteAdmin,
  deleteBuilding,
  deleteLocation,
  removeInstituteAdmin,
  upsertBuilding,
  upsertLocation,
  type AdminAccount,
  type BuildingStore,
  type LocationStore,
} from "@/lib/admin";
import { useAdminRole } from "@/hooks/use-admin-role";
import { useNotices } from "@/hooks/use-notices";
import { NoticeView } from "@/components/sohoj/NoticeView";
import { AskCampusAi } from "@/components/sohoj/AskCampusAi";
import { useClassUpdates } from "@/hooks/use-class-updates";
import { summarizeForBanner, dateLabel, UPDATE_TYPES } from "@/lib/class-updates";
import { LandingPage } from "@/components/sohoj/LandingPage";
import {
  adminsResource,
  buildingsResource,
  roomsResource,
  routinesResource,
  startSync,
  teachersResource,
} from "@/lib/resources";
import { removeBuildingRow, upsertBuildingRow } from "@/lib/repo/buildings";
import { removeRoomRow, upsertRoomRow } from "@/lib/repo/rooms";
import { removeTeacherRow, upsertTeacherRow } from "@/lib/repo/teachers";
import { addAdminByEmail, removeAdminRow } from "@/lib/repo/admins";
import type { Building } from "@/lib/campus-data";
import { NavigationView } from "@/components/sohoj/NavigationView";
const CampusMap = lazy(() =>
  import("@/components/sohoj/CampusMap").then((m) => ({ default: m.CampusMap })),
);
const RoutineView = lazy(() =>
  import("@/components/sohoj/RoutineView").then((m) => ({ default: m.RoutineView })),
);
const BuildingView = lazy(() =>
  import("@/components/sohoj/BuildingView").then((m) => ({ default: m.BuildingView })),
);
import { hasCampusMap } from "@/lib/campus-map";
import {
  classesInRoom,
  currentClasses,
  currentClassesInRoom,
  mergeRoutineRooms,
  sortRooms,
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
import { decodeQr, type QrTarget } from "@/lib/qr";
import { parseShift, parseStudent, STUDENT_KEY, type StudentProfile } from "@/lib/student";
import { deleteTeacher, upsertTeacher, type Teacher, type TeacherStore } from "@/lib/teachers";
import { cn } from "@/lib/utils";
import { openFeedback } from "@/lib/feedback";
import { logEvent } from "@/lib/analytics";
import { Onboarding, InstallHint } from "@/components/sohoj/Onboarding";
import { OPEN_ADMIN_EVENT } from "@/components/sohoj/GlobalTabBar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Campus Path — Find your way on campus" },
      {
        name: "description",
        content:
          "Find any classroom, lab or office in Bangladesh polytechnic campuses with step-by-step directions, QR checkpoints and offline maps.",
      },
      { property: "og:title", content: "Campus Path — Find your way on campus" },
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

function groupByInstitute<T extends { instituteId?: string }>(list: T[]): Record<string, T[]> {
  return list.reduce<Record<string, T[]>>((acc, item) => {
    const id = item.instituteId ?? "rpi";
    (acc[id] ??= []).push(item);
    return acc;
  }, {});
}

function Index() {
  const [instituteId, setInstituteId] = useState(INSTITUTES[0].id);
  const [allRooms, setAllRooms] = useState<ReturnType<typeof roomsResource.get>>([]);
  const [lastSynced, setLastSynced] = useState(() => new Date(0));
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  // Admin mode follows the real signed-in account's email.
  const adminEmail = user?.email ?? null;
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [formInstituteId, setFormInstituteId] = useState<string>(INSTITUTES[0].id);
  const [startId, setStartId] = useState<StartPointId>("main-gate");
  const [startBuildingId, setStartBuildingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [view, setView] = useState<"list" | "routine" | "map" | "notice">("list");
  const [allBuildings, setAllBuildings] = useState<ReturnType<typeof buildingsResource.get>>([]);
  const [allTeachers, setAllTeachers] = useState<ReturnType<typeof teachersResource.get>>([]);
  const [routines, setRoutines] = useState<ClassRoutine[]>([]);
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const adminRole = useAdminRole();

  useEffect(() => {
    setAllRooms(roomsResource.get());
    return roomsResource.subscribe(setAllRooms);
  }, []);
  useEffect(() => {
    setAllBuildings(buildingsResource.get());
    return buildingsResource.subscribe(setAllBuildings);
  }, []);
  useEffect(() => {
    setAllTeachers(teachersResource.get());
    return teachersResource.subscribe(setAllTeachers);
  }, []);
  useEffect(() => {
    setRoutines(routinesResource.get());
    return routinesResource.subscribe(setRoutines);
  }, []);
  useEffect(() => {
    setAdmins(adminsResource.get());
    return adminsResource.subscribe(setAdmins);
  }, []);

  useEffect(() => {
    setMounted(true);
    setLastSynced(new Date());
    const updated = () => setLastSynced(new Date());
    const events = [
      "sohoj:rooms-changed",
      "sohoj:buildings-changed",
      "sohoj:routines-changed",
      "sohoj:teachers-changed",
      "sohoj:admins-changed",
    ];
    events.forEach((e) => window.addEventListener(e, updated));
    return () => events.forEach((e) => window.removeEventListener(e, updated));
  }, []);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const { updates: classUpdates, unreadCount } = useClassUpdates(studentProfile);
  const updateBanner = summarizeForBanner(classUpdates);

  const [qrBuilding, setQrBuilding] = useState<QrTarget | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);

  // Entry gate: login first, then class profile, then the app.
  useEffect(() => {
    if (authLoading) return;
    if (!user) return; // signed-out visitors see the landing page
    const saved = parseStudent(window.localStorage.getItem(STUDENT_KEY));
    if (!saved) {
      void navigate({ to: "/student", replace: true });
      return;
    }
    setStudentProfile(saved);
    setInstituteId(saved.instituteId);
    setFormInstituteId(saved.instituteId);
  }, [authLoading, user, navigate]);

  useEffect(() => {
    // Background revalidation from Supabase; offline serves the local cache.
    startSync();
    logEvent("app_open");
    // Shared QR links: /?qr=SOHOJ1|rpi|academic|building
    try {
      const target = decodeQr(new URLSearchParams(window.location.search).get("qr"));
      if (target && INSTITUTES.some((i) => i.id === target.instituteId)) {
        setInstituteId(target.instituteId);
        setFormInstituteId(target.instituteId);
        setQrBuilding(target);
        logEvent("qr_scan", { kind: "link" });
      }
    } catch {
      /* ignore bad link */
    }
    const viewParam = new URLSearchParams(window.location.search).get("view");
    if (viewParam === "routine" || viewParam === "map") setView(viewParam);
  }, []);

  const buildingStore = useMemo<BuildingStore>(
    () => groupByInstitute(allBuildings),
    [allBuildings],
  );
  const store = useMemo<LocationStore>(
    () => mergeRoutineRooms(groupByInstitute(allRooms), routines),
    [allRooms, routines],
  );
  const teacherStore = useMemo<TeacherStore>(() => groupByInstitute(allTeachers), [allTeachers]);

  const institute = INSTITUTES.find((i) => i.id === instituteId) ?? INSTITUTES[0];
  const noticesApi = useNotices(institute.id);
  const refreshNotices = noticesApi.refresh;
  useEffect(() => {
    if (!user) return;
    void refreshNotices();
    const timer = window.setInterval(() => void refreshNotices(), 10 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [user, institute.id, refreshNotices]);

  const buildings = buildingStore[institute.id] ?? institute.buildings;
  const locations = useMemo(() => store[institute.id] ?? institute.locations, [store, institute]);
  const isAdmin = adminRole.isAdmin;
  const isSuper = adminRole.isSuper;
  const allowedInstituteIds = adminRole.allowedInstituteIds;
  const profile = adminRole.isAdmin
    ? { instituteId: adminRole.isSuper ? "all" : (allowedInstituteIds[0] ?? "") }
    : null;
  const visibleInstitutes =
    isSuper || !profile ? INSTITUTES : INSTITUTES.filter((i) => allowedInstituteIds.includes(i.id));
  const instituteRoutines = routines.filter((r) => r.instituteId === institute.id);

  const now = new Date();
  // Dhaka time keeps server and client render identical regardless of host timezone.
  const hour =
    Number(
      new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Dhaka",
        hour: "2-digit",
        hour12: false,
      }).format(now),
    ) % 24;
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const liveNow = currentClasses(instituteRoutines, now);
  const results = useMemo(
    () => sortRooms(searchLocations(locations, buildings, query, filter)),
    [locations, buildings, query, filter],
  );
  const groupedResults = useMemo(() => {
    const map = new Map<string, CampusLocation[]>();
    for (const loc of results) {
      const list = map.get(loc.buildingId) ?? [];
      list.push(loc);
      map.set(loc.buildingId, list);
    }
    return [...map.entries()].map(([id, list]) => ({
      id,
      building: buildings.find((b) => b.id === id),
      list,
    }));
  }, [results, buildings]);
  const showBuildings = query.trim() === "" && filter === "all";
  const selected = locations.find((l) => l.id === selectedId) ?? null;
  const start = ALL_START_POINTS.find((s) => s.id === startId) ?? MAIN_GATE;
  const startOptions =
    startId === QR_START_POINT.id ? [...START_POINTS, QR_START_POINT] : START_POINTS;

  function changeStart(value: string) {
    if (value.startsWith("b:")) {
      const id = value.slice(2);
      const building = buildings.find((b) => b.id === id);
      if (!building) return;
      setStartBuildingId(id);
      const nearest = (Object.entries(building.distance) as [StartPointId, number][]).sort(
        (a, b) => a[1] - b[1],
      )[0]?.[0];
      setStartId(nearest ?? "main-gate");
      return;
    }
    setStartBuildingId(null);
    setStartId(value as StartPointId);
  }

  function changeInstitute(id: string) {
    setInstituteId(id);
    setView("list");
    setSelectedId(null);
    setSelectedBuildingId(null);
    setQrBuilding(null);
    setStartBuildingId(null);
    setQuery("");
    setFilter("all");
    setDownloading(true);
    setTimeout(() => setDownloading(false), 900);
  }

  function commit(next: LocationStore) {
    roomsResource.set(
      Object.values(next)
        .flat()
        .map((r) => ({ ...r, instituteId: institute.id })),
    );
  }

  function saveLocation(targetInstituteId: string, loc: CampusLocation) {
    if (!isAdmin) return;
    const isEdit = editing !== null;
    commit(upsertLocation(store, targetInstituteId, loc));
    void upsertRoomRow({ ...loc, instituteId: targetInstituteId }).catch(() => {});
    toast.success(isEdit ? `${loc.name} updated` : `${loc.name} added to the map`, {
      description: "এখন সার্চে দেখা যাবে",
    });
    setEditing(null);
  }

  function removeLocation(targetInstituteId: string, loc: CampusLocation) {
    if (!isAdmin) return;
    commit(deleteLocation(store, targetInstituteId, loc.id));
    void removeRoomRow(loc.id).catch(() => {});
    if (selectedId === loc.id) setSelectedId(null);
    toast.success(`${loc.name} deleted`);
  }

  function addAdmin(email: string, instituteId: string) {
    if (!isSuper || !adminEmail) return;
    const result = addInstituteAdmin(admins, email, instituteId, adminEmail);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    adminsResource.set(result.accounts);
    void addAdminByEmail(email, instituteId).catch(() => {});
    toast.success(`${email} added`, { description: "Ekhon ei institute access pabe" });
  }

  function removeAdmin(email: string) {
    if (!isSuper) return;
    const next = removeInstituteAdmin(admins, email);
    adminsResource.set(next);
    const target = admins.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
    if (target?.addedBy && target.addedBy !== "system")
      void removeAdminRow(target.addedBy).catch(() => {});
    toast.success(`${email} removed`);
  }

  function commitBuildings(next: BuildingStore) {
    buildingsResource.set(
      Object.values(next)
        .flat()
        .map((b) => ({ ...b, instituteId: institute.id, isCustom: true })),
    );
  }

  function saveBuilding(building: Building) {
    if (!isAdmin) return;
    commitBuildings(upsertBuilding(buildingStore, institute.id, building));
    void upsertBuildingRow({ ...building, instituteId: institute.id, isCustom: true }).catch(
      () => {},
    );
    toast.success(`${building.name} saved`, {
      description: "এই ভবনের নিচে এখন রুম যোগ করা যাবে",
    });
  }

  function removeBuilding(buildingId: string) {
    const name = buildings.find((b) => b.id === buildingId)?.name ?? "Building";
    commitBuildings(deleteBuilding(buildingStore, institute.id, buildingId));
    void removeBuildingRow(`${institute.id}-${buildingId}`).catch(() => {});
    toast.success(`${name} removed`);
  }

  function commitTeachers(next: TeacherStore) {
    teachersResource.set(
      Object.values(next)
        .flat()
        .map((t) => ({ ...t, instituteId: institute.id })),
    );
  }

  function saveTeacher(teacher: Teacher) {
    if (!isAdmin) return;
    commitTeachers(upsertTeacher(teacherStore, institute.id, teacher));
    void upsertTeacherRow({ ...teacher, instituteId: institute.id }).catch(() => {});
    toast.success(`${teacher.name} saved`, { description: "Teachers page-e dekha jay" });
  }

  function removeTeacher(id: string) {
    commitTeachers(deleteTeacher(teacherStore, institute.id, id));
    void removeTeacherRow(id).catch(() => {});
    toast.success("Teacher removed");
  }

  // Admin users land on their own institute.
  useEffect(() => {
    if (profile && profile.instituteId !== "all") {
      setInstituteId(profile.instituteId);
      setFormInstituteId(profile.instituteId);
    }
  }, [profile?.instituteId]);

  async function handleLogout() {
    setPanelOpen(false);
    await signOut();
    toast("Signed out");
  }

  // The global tab bar opens the admin drawer through this event.
  useEffect(() => {
    const open = () => setPanelOpen(true);
    window.addEventListener(OPEN_ADMIN_EVENT, open);
    return () => window.removeEventListener(OPEN_ADMIN_EVENT, open);
  }, []);

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

  const handleQrDetected = useCallback(
    (target: QrTarget) => {
      setInstituteId(target.instituteId);
      setFormInstituteId(target.instituteId);
      setSelectedId(null);
      setView("list");
      setStartBuildingId(target.buildingId);
      setStartId(target.buildingId === "academic" ? QR_START_POINT.id : "main-gate");
      logEvent("qr_scan", { kind: "scan" });
      if (target.kind === "room" && target.room) {
        const found = (store[target.instituteId] ?? []).find(
          (l) => l.name === `Room ${target.room}`,
        );
        if (found) {
          setSelectedId(found.id);
          toast.success(`Room ${target.room} found`, {
            description: "Class ও sir-er naam ni dekha jay",
          });
          return;
        }
      }
      setQrBuilding(target);
      toast.success("Building found", {
        description: "এই ভবনের রুম, ক্লাস ও শিক্ষক দেখা যাচ্ছে",
      });
    },
    [store],
  );

  function openLocation(id: string) {
    const loc = Object.values(store)
      .flat()
      .find((l) => l.id === id);
    if (loc) logEvent("search", { room: loc.name });
    setSelectedId(id);
    setSelectedBuildingId(null);
    setQrBuilding(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!authLoading && !user) return <LandingPage />;

  return (
    <Suspense
      fallback={
        <div className="grid min-h-dvh place-items-center px-4">
          <Logo variant="icon" size={40} className="animate-pulse motion-reduce:animate-none" />
        </div>
      }
    >
      <div className="bg-desk min-h-screen md:px-6 lg:flex lg:items-start lg:justify-center lg:gap-12 lg:px-10 lg:py-10">
        {/* Desktop pitch panel */}
        <aside className="hidden max-w-sm pt-16 xl:block">
          <Logo variant="icon" size={36} className="size-14" />
          <h1 className="mt-6 text-4xl font-bold leading-tight text-primary">
            Every room,
            <br />
            one <span className="text-emerald">campus</span> path.
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
        <main className="mx-auto min-h-dvh w-full max-w-md bg-background pb-[env(safe-area-inset-bottom)] md:my-6 md:max-w-3xl md:rounded-3xl md:border md:border-border md:shadow-[var(--shadow-float)] lg:mx-0 lg:my-0 lg:max-w-5xl lg:min-h-[calc(100dvh-5rem)] lg:rounded-[2rem]">
          <Onboarding />

          {/* Header */}
          <header className="bg-hero rounded-b-[2rem] px-5 pb-16 pt-7 text-primary-foreground md:px-8 md:pb-20 md:pt-10 lg:px-10">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Logo variant="icon" size={36} />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald">
                    {greeting}
                  </p>
                  <h1 className="text-lg font-bold leading-tight">Campus Path</h1>
                  <p className="font-bangla text-xs text-primary-foreground/75">
                    আপনার স্মার্ট ক্যাম্পাস গাইড
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-primary-foreground/70">
                Your institute
              </label>
              {isAdmin && isSuper ? (
                <Select value={instituteId} onValueChange={changeInstitute}>
                  <SelectTrigger className="h-12 rounded-2xl border-primary-foreground/20 bg-primary-foreground/10 text-left text-primary-foreground [&_svg]:text-primary-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INSTITUTE_GROUPS.map((group) => (
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
                <div className="flex h-12 items-center gap-2 rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 px-4 text-left text-primary-foreground">
                  <Building2 className="size-4 shrink-0 text-emerald" />
                  <span className="truncate font-medium">{institute.name}</span>
                </div>
              )}
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="font-bangla text-primary-foreground/75">{institute.nameBn}</span>
                {downloading ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary-foreground/15 px-2.5 py-1 font-medium">
                    <Loader2 className="size-3.5 animate-spin" /> Downloading map…
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald/20 px-2.5 py-1 font-medium text-emerald">
                    <CheckCircle2 className="size-3.5" />
                    {!mounted
                      ? "Synced —"
                      : typeof navigator !== "undefined" && !navigator.onLine
                        ? "Offline · last cache"
                        : `Synced ${lastSynced.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                  </span>
                )}
              </div>
            </div>
          </header>

          <div className="-mt-12 space-y-5 px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] md:-mt-16 md:px-8 lg:px-10">
            {updateBanner && (
              <Link to="/updates" className="block">
                <div
                  className={`flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-xs font-semibold ${updateBanner.classOff || updateBanner.urgent ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-primary/20 bg-primary-soft text-primary"}`}
                >
                  <BellRing className="size-4 shrink-0" /> {updateBanner.label}
                </div>
              </Link>
            )}
            {studentProfile && classUpdates.length > 0 && (
              <Link to="/updates" className="animate-rise block">
                <section className="rounded-3xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-sm font-semibold">
                      <BellRing className="size-4 text-primary" /> Class Updates / ক্লাস আপডেট
                    </p>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {classUpdates.slice(0, 3).map((u) => (
                      <li key={u.id} className="flex items-start gap-2 text-xs">
                        <span
                          className={`mt-0.5 size-2 shrink-0 rounded-full ${u.urgent ? "bg-destructive" : "bg-primary"}`}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{u.title}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {UPDATE_TYPES.find((t) => t.id === u.type)?.label.split(" / ")[0]} ·{" "}
                            {dateLabel(u.eventDate)}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-[11px] font-semibold text-primary">See all / সব দেখুন →</p>
                </section>
              </Link>
            )}
            <div className="grid-cols-1 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {/* Right now — details live on their own page */}
              <Link to="/right-now" className="animate-rise block">
                <section className="overflow-hidden rounded-3xl border border-primary/10 bg-card shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-primary/30">
                  <div className="flex items-center gap-3 p-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                      <CalendarClock className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        Right now on campus
                      </span>
                      <span className="font-bangla mt-0.5 block truncate text-xs text-muted-foreground">
                        এখন কী চলছে
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-emerald-soft px-2.5 py-1 text-[10px] font-bold text-emerald">
                      {liveNow.length} live
                    </span>
                    <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                  </div>
                </section>
              </Link>

              {/* Student account + class journey */}
              <Link to="/student" className="animate-rise block">
                <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-primary/30">
                  <div className="flex items-center gap-3 p-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                      <UserRound className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">Student Account</span>
                      <span className="font-bangla mt-0.5 block truncate text-xs text-muted-foreground">
                        পরের ক্লাসের যাত্রা
                      </span>
                    </span>
                    <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                  </div>
                </section>
              </Link>

              {/* Faculty directory */}
              <Link to="/teachers" className="animate-rise block">
                <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-primary/30">
                  <div className="flex items-center gap-3 p-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-soft text-emerald">
                      <UserRound className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">Teachers</span>
                      <span className="font-bangla mt-0.5 block truncate text-xs text-muted-foreground">
                        বিভাগভিত্তিক শিক্ষক তালিকা
                      </span>
                    </span>
                    <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                  </div>
                </section>
              </Link>
            </div>

            {/* Current location */}
            <section className="rounded-3xl border border-border bg-card p-4 shadow-[var(--shadow-float)]">
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  <LocateFixed className="size-4 text-emerald" /> Where are you now?
                </p>
                <span className="font-bangla text-[11px] text-muted-foreground">
                  আপনি এখন কোথায়?
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <Select
                  value={startBuildingId ? `b:${startBuildingId}` : startId}
                  onValueChange={changeStart}
                >
                  <SelectTrigger
                    className="h-12 min-w-0 flex-1 rounded-2xl bg-muted/60 text-left"
                    aria-label="Current location"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Start points</SelectLabel>
                      {startOptions.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Buildings</SelectLabel>
                      {buildings.map((b) => (
                        <SelectItem key={b.id} value={`b:${b.id}`}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
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
                  "grid-cols-4",
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
                    "flex min-w-0 items-center justify-center gap-1 whitespace-nowrap rounded-xl px-0.5 py-2.5 text-[10px] font-semibold transition-all sm:gap-1.5 sm:px-1 sm:text-xs",
                    view === "list"
                      ? "bg-primary text-primary-foreground shadow-[var(--shadow-card)]"
                      : "text-muted-foreground",
                  )}
                >
                  <List className="size-3.5 shrink-0 sm:size-4" />{" "}
                  <span className="sm:hidden">Places</span>
                  <span className="hidden sm:inline">Destinations</span>
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
                      "flex min-w-0 items-center justify-center gap-1 whitespace-nowrap rounded-xl px-0.5 py-2.5 text-[10px] font-semibold transition-all sm:gap-1.5 sm:px-1 sm:text-xs",
                      view === "routine"
                        ? "bg-primary text-primary-foreground shadow-[var(--shadow-card)]"
                        : "text-muted-foreground",
                    )}
                  >
                    <BookOpen className="size-3.5 shrink-0 sm:size-4" />{" "}
                    <span className="sm:hidden">Routine</span>
                    <span className="hidden sm:inline">Class Routine</span>
                  </button>
                )}
                <button
                  type="button"
                  role="tab"
                  aria-selected={view === "notice"}
                  onClick={() => {
                    setSelectedId(null);
                    setView("notice");
                  }}
                  className={cn(
                    "flex min-w-0 items-center justify-center gap-1 whitespace-nowrap rounded-xl px-0.5 py-2.5 text-[10px] font-semibold transition-all sm:gap-1.5 sm:px-1 sm:text-xs",
                    view === "notice"
                      ? "bg-primary text-primary-foreground shadow-[var(--shadow-card)]"
                      : "text-muted-foreground",
                  )}
                >
                  <BellRing className="size-3.5 shrink-0 sm:size-4" /> Notice
                </button>
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
                      "flex min-w-0 items-center justify-center gap-1 whitespace-nowrap rounded-xl px-0.5 py-2.5 text-[10px] font-semibold transition-all sm:gap-1.5 sm:px-1 sm:text-xs",
                      view === "map"
                        ? "bg-primary text-primary-foreground shadow-[var(--shadow-card)]"
                        : "text-muted-foreground",
                    )}
                  >
                    <MapIcon className="size-3.5 shrink-0 sm:size-4" />{" "}
                    <span className="sm:hidden">Map</span>
                    <span className="hidden sm:inline">Campus Map</span>
                  </button>
                )}
              </div>
            )}

            {qrBuilding && qrBuilding.instituteId === institute.id ? (
              <BuildingView
                institute={institute}
                buildings={buildings}
                buildingId={qrBuilding.buildingId}
                rooms={locations}
                routines={routines}
                onSelectRoom={openLocation}
                onBack={() => setQrBuilding(null)}
              />
            ) : selectedBuildingId ? (
              <BuildingView
                institute={institute}
                buildings={buildings}
                buildingId={selectedBuildingId}
                rooms={locations}
                routines={routines}
                onSelectRoom={openLocation}
                onBack={() => setSelectedBuildingId(null)}
              />
            ) : selected ? (
              <NavigationView
                location={selected}
                start={start}
                buildings={buildings}
                showCampusMap={hasCampusMap(institute.id)}
                roomClasses={classesInRoom(routines, selected.name)}
                liveClasses={currentClassesInRoom(routines, selected.name)}
                onBack={() => setSelectedId(null)}
              />
            ) : view === "routine" ? (
              <RoutineView
                profileSemester={studentProfile?.semester ?? null}
                profileShift={parseShift(studentProfile?.shift)}
                instituteId={institute.id}
                isSuper={isSuper}
                teachers={allTeachers}
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
            ) : view === "notice" ? (
              <NoticeView
                notices={noticesApi.notices.filter((n) => n.instituteId === institute.id)}
                loading={noticesApi.loading}
                error={noticesApi.error}
                onRefresh={() => void noticesApi.refresh()}
              />
            ) : view === "map" && institute.map ? (
              <CampusMap
                map={institute.map}
                instituteName={institute.name}
                onSelectBuilding={(id) => {
                  const b = buildings.find((x) => x.id === id);
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
                <section className="sticky top-0 z-20 -mx-4 space-y-3 bg-background/85 px-4 pb-2 pt-2 backdrop-blur-xl">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && query.trim())
                          logEvent("search", { room: query.trim() });
                      }}
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
                    <h2 className="text-base font-semibold">
                      {showBuildings ? "Buildings" : "Destinations"}
                    </h2>
                    <span className="text-xs text-muted-foreground">
                      {showBuildings ? `${buildings.length} buildings` : `${results.length} found`}
                    </span>
                  </div>
                  {showBuildings ? (
                    <div className="grid-cols-1 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {buildings.map((b) => {
                        const inBuilding = locations.filter((l) => l.buildingId === b.id);
                        const floors = new Set(inBuilding.map((l) => l.floor)).size;
                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => setSelectedBuildingId(b.id)}
                            className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-left shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-primary/30 active:scale-[0.99]"
                          >
                            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                              <Building2 className="size-5" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold">{b.name}</span>
                              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                {inBuilding.length} rooms · {floors} floors
                              </span>
                            </span>
                            <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                          </button>
                        );
                      })}
                    </div>
                  ) : results.length === 0 ? (
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
                    <div className="space-y-4">
                      {groupedResults.map((group) => (
                        <div key={group.id}>
                          <div className="mb-2 flex items-center gap-2 px-1">
                            <Building2 className="size-3.5 text-primary" />
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-primary">
                              {group.building?.name ?? "Other"}
                            </h3>
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                              {group.list.length}
                            </span>
                          </div>
                          <ul className="grid-cols-1 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {group.list.map((loc, i) => {
                              const Icon = CATEGORY_ICON[loc.category];
                              return (
                                <li
                                  key={loc.id}
                                  className="animate-rise"
                                  style={{ animationDelay: `${i * 40}ms` }}
                                >
                                  <div className="flex items-center gap-1 rounded-2xl border border-border bg-card p-3.5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-primary/30">
                                    <button
                                      type="button"
                                      onClick={() => openLocation(loc.id)}
                                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
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
                                          {loc.buildingNo ? `Building ${loc.buildingNo} · ` : ""}
                                          {floorLabel(loc.floor)}
                                        </span>
                                      </span>
                                    </button>
                                    <button
                                      type="button"
                                      aria-label={`Report wrong info about ${loc.name}`}
                                      onClick={() =>
                                        openFeedback({
                                          category: "missing_room",
                                          message: `Room ${loc.name} — `,
                                          page: "home",
                                        })
                                      }
                                      className="shrink-0 rounded-lg p-1.5 text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive"
                                    >
                                      <Flag className="size-4" />
                                    </button>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}

            <InstallHint />

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
              <Logo variant="icon" size={16} /> Campus Path · Made for Bangladesh polytechnic
              students
            </p>
          </div>
          <AskCampusAi instituteId={institute.id} />
        </main>

        <QrScannerDialog open={qrOpen} onOpenChange={setQrOpen} onDetected={handleQrDetected} />
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
              buildings={buildings}
              teacherStore={teacherStore}
              onLogout={handleLogout}
              onAdd={openAddForm}
              onEdit={openEditForm}
              onDelete={removeLocation}
              onAddAdmin={addAdmin}
              onRemoveAdmin={removeAdmin}
              onSaveBuilding={saveBuilding}
              onDeleteBuilding={removeBuilding}
              onSaveTeacher={saveTeacher}
              onDeleteTeacher={removeTeacher}
              noticesApi={noticesApi}
            />
            <LocationFormDialog
              open={formOpen}
              onOpenChange={(o) => {
                setFormOpen(o);
                if (!o) setEditing(null);
              }}
              defaultInstituteId={formInstituteId}
              buildingStore={buildingStore}
              editing={editing}
              onSave={saveLocation}
            />
          </>
        )}
      </div>
    </Suspense>
  );
}
