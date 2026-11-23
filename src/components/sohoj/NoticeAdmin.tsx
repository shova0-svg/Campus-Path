import { useState } from "react";
import { Check, Link2, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INSTITUTES } from "@/lib/campus-data";
import { validateManualNotice } from "@/lib/notices";
import type { NoticeSource } from "@/lib/notices";
import type { StoredNotice } from "@/lib/repo/notices";

interface Props {
  sources: NoticeSource[];
  notices: StoredNotice[];
  onSourcesChange: (sources: NoticeSource[]) => void;
  onAddManual: (input: { title: string; date: string; url: string; instituteId: string }) => void;
  onFetchNow: () => void;
  onApprove: (id: string, status: "approved" | "rejected") => void;
  onEdit: (id: string, patch: { title?: string; url?: string; published_date?: string }) => void;
  onRemove: (id: string) => void;
  loading: boolean;
  error: string;
}

export function NoticeAdmin({
  sources,
  notices,
  onSourcesChange,
  onAddManual,
  onFetchNow,
  onApprove,
  onEdit,
  onRemove,
  loading,
  error,
}: Props) {
  const [instituteId, setInstituteId] = useState(INSTITUTES[0]?.id ?? "rpi");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [url, setUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkInstitute, setLinkInstitute] = useState(INSTITUTES[0]?.id ?? "rpi");
  const [editing, setEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function add() {
    const found = validateManualNotice({ title, date, url, instituteId });
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    onAddManual({ title, date, url, instituteId });
    setTitle("");
    setDate("");
    setUrl("");
    setErrors({});
  }

  function dropLink() {
    if (!/^https?:\/\//i.test(linkUrl.trim())) {
      setErrors({ link: "http(s) link দিন" });
      return;
    }
    const label = INSTITUTES.find((i) => i.id === linkInstitute)?.name ?? linkInstitute;
    onSourcesChange([
      ...sources.filter((s) => s.instituteId !== linkInstitute),
      {
        instituteId: linkInstitute,
        label,
        url: linkUrl.trim(),
      },
    ]);
    setLinkUrl("");
    setErrors({});
  }

  const pending = notices.filter((n) => n.status === "pending");
  const approved = notices.filter((n) => n.status === "approved");

  return (
    <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
      {error && (
        <p className="rounded-xl bg-destructive/10 p-2 text-xs text-destructive">{error}</p>
      )}

      <div className="space-y-2 rounded-2xl border border-border p-3">
        <p className="text-xs font-semibold">Add notice manually / নোটিশ যোগ করুন</p>
        <Select value={instituteId} onValueChange={setInstituteId}>
          <SelectTrigger className="h-10 rounded-xl" aria-label="Notice polytechnic">
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
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Notice title / শিরোনাম"
          aria-label="Notice title"
          className="h-10 rounded-xl"
        />
        {errors["title"] && <p className="text-[11px] text-destructive">{errors["title"]}</p>}
        <Input
          value={date}
          onChange={(e) => setDate(e.target.value)}
          placeholder="Date (dd-mm-yyyy)"
          aria-label="Notice date"
          className="h-10 rounded-xl"
        />
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Link (optional)"
          aria-label="Notice link"
          className="h-10 rounded-xl"
        />
        {errors["url"] && <p className="text-[11px] text-destructive">{errors["url"]}</p>}
        <Button variant="emerald" size="sm" className="w-full" onClick={add}>
          <Plus className="size-4" /> Add notice
        </Button>
      </div>

      <div className="space-y-2 rounded-2xl border border-border p-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold">
          <Link2 className="size-3.5 text-primary" /> Drop a notice link
        </p>
        <p className="text-[11px] text-muted-foreground">
          লিংক দিলে ওই সাইট থেকে নোটিশ ফেচ করে এখানে দেখাবে।
        </p>
        <Select value={linkInstitute} onValueChange={setLinkInstitute}>
          <SelectTrigger className="h-10 rounded-xl" aria-label="Notice source polytechnic">
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
        <Input
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder="https://…/pages/notices"
          aria-label="Notice source URL"
          className="h-10 rounded-xl"
        />
        {errors["link"] && <p className="text-[11px] text-destructive">{errors["link"]}</p>}
        <Button variant="outline" size="sm" className="w-full" onClick={dropLink}>
          <Link2 className="size-4" /> Save link
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold">Saved sources ({sources.length})</p>
          <Button variant="ghost" size="sm" onClick={onFetchNow} disabled={loading}>
            <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} /> Fetch now
          </Button>
        </div>
        {sources.map((s) => (
          <div key={s.instituteId} className="rounded-xl bg-muted/60 p-2.5">
            <p className="truncate text-[11px] font-semibold">{s.label}</p>
            <p className="truncate text-[10px] text-muted-foreground">{s.url}</p>
            <button
              type="button"
              aria-label={`Remove ${s.label} source`}
              onClick={() =>
                onSourcesChange(sources.filter((x) => x.instituteId !== s.instituteId))
              }
              className="mt-1 text-[10px] text-destructive"
            >
              <Trash2 className="mr-1 inline size-3" /> Remove
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold">Pending approval ({pending.length})</p>
        {pending.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-4 text-center text-[11px] text-muted-foreground">
            Kono pending notice nei.
          </p>
        ) : (
          pending.map((n) => (
            <div key={n.id} className="rounded-xl border border-border p-2.5">
              {editing === n.id ? (
                <div className="space-y-1.5">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    aria-label="Edit title"
                    className="h-9 rounded-lg text-xs"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      onEdit(n.id, { title: editTitle });
                      setEditing(null);
                    }}
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-xs font-semibold">{n.title}</p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {n.date} · {n.url}
                  </p>
                  <div className="mt-1.5 flex gap-1.5">
                    <Button size="sm" variant="emerald" onClick={() => onApprove(n.id, "approved")}>
                      <Check className="size-3.5" /> Approve
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onApprove(n.id, "rejected")}>
                      <X className="size-3.5" /> Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditing(n.id);
                        setEditTitle(n.title);
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onRemove(n.id)}>
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold">Published ({approved.length})</p>
        {approved.map((n) => (
          <div key={n.id} className="flex items-center gap-2 rounded-xl bg-muted/60 p-2.5">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold">{n.title}</span>
              <span className="block truncate text-[10px] text-muted-foreground">
                {n.date}
                {n.pushedAt ? " · push sent" : ""}
              </span>
            </span>
            <a
              href={n.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-semibold text-primary"
            >
              View
            </a>
            <button type="button" aria-label={`Delete ${n.title}`} onClick={() => onRemove(n.id)}>
              <Trash2 className="size-3.5 text-destructive" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
