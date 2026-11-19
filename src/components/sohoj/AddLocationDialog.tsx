import { useState, type FormEvent } from "react";
import { MapPinPlus } from "lucide-react";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORY_META,
  floorLabel,
  type Building,
  type CampusLocation,
  type Category,
  type Side,
} from "@/lib/campus-data";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instituteName: string;
  buildings: Building[];
  onAdd: (loc: CampusLocation) => void;
}

export function AddLocationDialog({ open, onOpenChange, instituteName, buildings, onAdd }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("classroom");
  const [buildingId, setBuildingId] = useState(buildings[0]?.id ?? "academic");
  const [floor, setFloor] = useState("1");
  const [turn, setTurn] = useState<Side>("left");
  const [side, setSide] = useState<Side>("right");
  const [door, setDoor] = useState("1");
  const [landmark, setLandmark] = useState("");

  const valid = name.trim().length > 1 && landmark.trim().length > 1;

  function reset() {
    setName("");
    setLandmark("");
    setCategory("classroom");
    setFloor("1");
    setDoor("1");
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!valid) return;
    onAdd({
      id: `custom-${Date.now()}`,
      name: name.trim(),
      category,
      buildingId,
      floor: Number(floor),
      turn,
      side,
      door: Number(door),
      landmark: landmark.trim(),
      custom: true,
    });
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-md overflow-y-auto rounded-3xl">
        <DialogHeader className="text-left">
          <DialogTitle className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-soft text-emerald">
              <MapPinPlus className="size-5" />
            </span>
            Add New Room / Map
          </DialogTitle>
          <DialogDescription>
            <span className="font-bangla">ক্যাম্পাস অ্যাম্বাসেডর</span> · Help new students at{" "}
            {instituteName}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
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
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORY_META) as Category[]).map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_META[c].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Floor</Label>
              <Select value={floor} onValueChange={setFloor}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5].map((f) => (
                    <SelectItem key={f} value={String(f)}>
                      {floorLabel(f)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Building</Label>
            <Select value={buildingId} onValueChange={setBuildingId}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {buildings.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="landmark">Landmark direction</Label>
            <Textarea
              id="landmark"
              placeholder="e.g. Blue water filter"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              className="min-h-16 rounded-xl"
            />
            <p className="text-xs text-muted-foreground">
              A visible thing near the room students can spot easily.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Turn</Label>
              <Select value={turn} onValueChange={(v) => setTurn(v as Side)}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Door side</Label>
              <Select value={side} onValueChange={(v) => setSide(v as Side)}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Door #</Label>
              <Select value={door} onValueChange={setDoor}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2 sm:gap-2">
            <Button type="button" variant="outline" size="xl" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="emerald" size="xl" disabled={!valid}>
              Save to map
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
