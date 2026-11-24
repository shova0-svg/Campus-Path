import { BellRing, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Notice } from "@/lib/notices";

interface Props {
  notices: Notice[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
}

export function NoticeView({ notices, loading, error, onRefresh }: Props) {
  return (
    <section className="animate-rise space-y-3">
      <div className="flex items-center justify-between gap-3 rounded-3xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <BellRing className="size-4" /> Notice / নোটিশ
          </p>
          <p className="font-bangla mt-0.5 text-[11px] text-muted-foreground">
            অফিসিয়াল সাইট থেকে সর্বশেষ নোটিশ — {notices.length} টি
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
          <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} /> Refresh
        </Button>
      </div>

      {error && (
        <p className="rounded-2xl bg-destructive/10 p-3 text-center text-xs text-destructive">
          {error}
        </p>
      )}

      {notices.length === 0 && !loading ? (
        <p className="rounded-3xl border border-dashed border-border bg-card p-8 text-center font-bangla text-sm text-muted-foreground">
          এখনো কোনো নোটিশ নেই / No notices yet — Refresh চাপুন।
        </p>
      ) : (
        <ul className="grid-cols-1 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {notices.map((n) => (
            <li
              key={`${n.instituteId}:${n.id}`}
              className="animate-rise rounded-3xl border border-border bg-card p-3.5 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-start gap-3">
                {n.image && (
                  <img
                    src={n.image}
                    alt=""
                    loading="lazy"
                    className="size-12 shrink-0 rounded-xl bg-muted object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-snug">{n.title}</p>
                  <p className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{n.date || "—"}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[9px]">
                      {n.source === "manual" ? "Admin" : "RPI"}
                    </span>
                  </p>
                </div>
              </div>
              {n.url && (
                <a
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary"
                >
                  দেখুন / View <ExternalLink className="size-3" />
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
