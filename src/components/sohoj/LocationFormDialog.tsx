import { useEffect, useState, type FormEvent } from "react";
import { MapPinPlus, Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORY_META,
  floorLabel,
  groupInstitutes,
  INSTITUTES,
  type CampusLocation,
  type Category,
  type Side,
} from "@/lib/campus-data";

export interface EditTarget {
  instituteId: string;
  location: CampusLocation;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultInstituteId: string;
  /** When set, the form edits this room instead of adding a new one. */
  editing: EditTarget | null;
  onSave: (instituteId: string, loc: CampusLocation) => void;
}

function SimpleSelect({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; group?: string }[];
  label: string;
}) {
  const groups = [...new Set(options.map((o) => o.group).filter(Boolean) as string[])];
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-11 rounded-xl" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {groups.length > 0
          ? groups.map((group) => (
              <SelectGroup key={group}>
                <SelectLabel>{group}</SelectLabel>
                {options
                  .filter((o) => o.group === group)
                  .map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
              </SelectGroup>
            ))
          : options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
      </SelectContent>
    </Select>
  );
}

const SIDES = [
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
];

export function LocationFormDialog({
  open,
  onOpenChange,
  defaultInstituteId,
  editing,
  onSave,
}: Props) {
  const [instituteId, setInstituteId] = useState(defaultInstituteId);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("classroom");
  const [buildingId, setBuildingId] = useState("academic");
  const [floor, setFloor] = useState("1");
  const [walkingSteps, setWalkingSteps] = useState("");
  const [landmark, setLandmark] = useState("");
  const [directions, setDirections] = useState("");
  const [turn, setTurn] = useState<Side>("left");
  const [side, setSide] = useState<Side>("right");
  const [door, setDoor] = useState("1");

  useEffect(() => {
    if (!open) return;
    const loc = editing?.location;
    const instId = editing?.instituteId ?? defaultInstituteId;
    const inst = INSTITUTES.find((i) => i.id === instId) ?? INSTITUTES[0];
    setInstituteId(inst.id);
    setName(loc?.name ?? "");
    setCategory(loc?.category ?? "classroom");
    setBuildingId(loc?.buildingId ?? inst.buildings[0]?.id ?? "academic");
    setFloor(String(loc?.floor ?? 1));
    setWalkingSteps(loc?.walkingSteps ? String(loc.walkingSteps) : "");
    setLandmark(loc?.landmark ?? "");
    setDirections((loc?.directions ?? []).join("\n"));
    setTurn(loc?.turn ?? "left");
    setSide(loc?.side ?? "right");
    setDoor(String(loc?.door ?? 1));
  }, [open, editing, defaultInstituteId]);

  const institute = INSTITUTES.find((i) => i.id === instituteId) ?? INSTITUTES[0];
  const buildings = institute.buildings;
  const stepsNum = Number(walkingSteps);
  const stepsValid = walkingSteps.trim() === "" || (Number.isFinite(stepsNum) && stepsNum > 0);
  const valid = name.trim().length > 1 && landmark.trim().length > 1 && stepsValid;

  function changeInstitute(id: string) {
    setInstituteId(id);
    const inst = INSTITUTES.find((i) => i.id === id);
    if (inst && !inst.buildings.some((b) => b.id === buildingId)) {
      setBuildingId(inst.buildings[0]?.id ?? "academic");
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!valid) return;
    const lines = directions
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const base = editing?.location;
    const loc: CampusLocation = {
      ...base,
      id: base?.id ?? `custom-${Date.now()}`,
      name: name.trim(),
      category,
      buildingId,
      floor: Number(floor),
      turn,
      side,
      door: Number(door),
      landmark: landmark.trim(),
      custom: base ? base.custom === true : true,
    };
    delete loc.walkingSteps;
    delete loc.directions;
    if (walkingSteps.trim()) loc.walkingSteps = Math.round(stepsNum);
    if (lines.length) loc.directions = lines;
    onSave(institute.id, loc);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-md overflow-y-auto rounded-3xl">
        <DialogHeader className="text-left">
          <DialogTitle className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-soft text-emerald">
              {editing ? <Pencil className="size-5" /> : <MapPinPlus className="size-5" />}
            </span>
            {editing ? "Edit Room" : "Add New Room"}
          </DialogTitle>
          <DialogDescription>
            Changes show in the app right away and stay saved on this device.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Institute</Label>
            <SimpleSelect
              label="Institute"
              value={instituteId}
              onChange={changeInstitute}
              options={groupInstitutes(INSTITUTES).flatMap((g) =>
                g.items.map((i) => ({ value: i.id, label: i.name, group: g.label })),
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="room-name">Room / place name</Label>
            <Input
              id="room-name"
              placeholder="e.g. Room 304 (Power Tech)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <SimpleSelect
                label="Category"
                value={category}
                onChange={(v) => setCategory(v as Category)}
                options={(Object.keys(CATEGORY_META) as Category[]).map((c) => ({
                  value: c,
                  label: CATEGORY_META[c].label,
                }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Floor</Label>
              <SimpleSelect
                label="Floor"
                value={floor}
                onChange={setFloor}
                options={[0, 1, 2, 3, 4, 5].map((f) => ({
                  value: String(f),
                  label: floorLabel(f),
                }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-[1fr_8rem] gap-3">
            <div className="space-y-1.5">
              <Label>Building</Label>
              <SimpleSelect
                label="Building"
                value={buildingId}
                onChange={setBuildingId}
                options={buildings.map((b) => ({ value: b.id, label: b.name }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="walking-steps">Walking steps</Label>
              <Input
                id="walking-steps"
                type="number"
                min={1}
                inputMode="numeric"
                placeholder="Auto"
                value={walkingSteps}
                onChange={(e) => setWalkingSteps(e.target.value)}
                className="h-11 rounded-xl"
                aria-invalid={!stepsValid}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="landmark">Main landmark near the room</Label>
            <Input
              id="landmark"
              placeholder="e.g. Blue water filter"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="directions">Step-by-step landmark directions</Label>
            <Textarea
              id="directions"
              placeholder={
                "Walk straight past the Shaheed Minar\nTake the main stairs to the 3rd floor\nTurn left at the blue water filter — 2nd door on your right"
              }
              value={directions}
              onChange={(e) => setDirections(e.target.value)}
              className="min-h-28 rounded-xl"
            />
            <p className="text-xs text-muted-foreground">
              One step per line. Leave empty to create steps automatically from the student's start
              point.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Turn</Label>
              <SimpleSelect
                label="Turn"
                value={turn}
                onChange={(v) => setTurn(v as Side)}
                options={SIDES}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Door side</Label>
              <SimpleSelect
                label="Door side"
                value={side}
                onChange={(v) => setSide(v as Side)}
                options={SIDES}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Door #</Label>
              <SimpleSelect
                label="Door number"
                value={door}
                onChange={setDoor}
                options={[1, 2, 3, 4].map((d) => ({ value: String(d), label: String(d) }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2 sm:gap-2">
            <Button type="button" variant="outline" size="xl" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="emerald" size="xl" disabled={!valid}>
              {editing ? "Save changes" : "Add room"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
