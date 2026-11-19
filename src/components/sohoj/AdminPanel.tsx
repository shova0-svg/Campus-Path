import { useEffect, useMemo, useState } from "react";
import { LogOut, Pencil, Plus, Search, ShieldCheck, Trash2 } from "lucide-react";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_ICON, CATEGORY_TONE } from "./category-icon";
import { floorLabel, INSTITUTES, searchLocations, type CampusLocation } from "@/lib/campus-data";
import type { LocationStore } from "@/lib/admin";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  store: LocationStore;
  currentInstituteId: string;
  onLogout: () => void;
  onAdd: (instituteId: string) => void;
  onEdit: (instituteId: string, loc: CampusLocation) => void;
  onDelete: (instituteId: string, loc: CampusLocation) => void;
}

export function AdminPanel({
  open,
  onOpenChange,
  email,
  store,
  currentInstituteId,
  onLogout,
  onAdd,
  onEdit,
  onDelete,
}: Props) {
  const [instituteId, setInstituteId] = useState(currentInstituteId);
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<CampusLocation | null>(null);

  useEffect(() => {
    if (open) setInstituteId(currentInstituteId);
  }, [open, currentInstituteId]);

  const institute = INSTITUTES.find((i) => i.id === instituteId) ?? INSTITUTES[0];
  const rooms = store[institute.id] ?? [];
  const shown = useMemo(
    () => searchLocations(rooms, institute.buildings, query, "all"),
    [rooms, institute.buildings, query],
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[92vh] max-w-md flex-col gap-0 overflow-hidden rounded-3xl p-0">
          <div className="bg-hero px-5 pb-5 pt-5 text-primary-foreground">
            <DialogHeader className="space-y-0 pr-6 text-left">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="size-5 text-emerald" /> Admin Panel
              </DialogTitle>
              <DialogDescription className="text-primary-foreground/80">
                Logged in as Admin (<span className="break-all font-medium text-primary-foreground">{email}</span>)
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 flex gap-2">
              <Select value={instituteId} onValueChange={setInstituteId}>
                <SelectTrigger
                  aria-label="Institute to manage"
                  className="h-11 min-w-0 flex-1 rounded-xl border-primary-foreground/20 bg-primary-foreground/10 text-left text-primary-foreground [&_svg]:text-primary-foreground"
                >
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
              <Button variant="glass" size="lg" onClick={onLogout} className="h-11 shrink-0">
                <LogOut /> Logout
              </Button>
            </div>
          </div>

          <div className="space-y-3 border-b border-border px-5 py-4">
            <Button variant="emerald" size="xl" className="w-full" onClick={() => onAdd(institute.id)}>
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
                No rooms here yet. Tap "Add New Room".
              </li>
            )}
            {shown.map((loc) => {
              const Icon = CATEGORY_ICON[loc.category];
              const building = institute.buildings.find((b) => b.id === loc.buildingId);
              return (
                <li key={loc.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                  <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", CATEGORY_TONE[loc.category])}>
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
        </DialogContent>
      </Dialog>

      <AlertDialog open={pendingDelete !== null} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent className="max-w-sm rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this room?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.name} will be removed from {institute.name} for students using this device.
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
