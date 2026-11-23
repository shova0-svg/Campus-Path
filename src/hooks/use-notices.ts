import { useCallback, useEffect, useState } from "react";
import { makeManualNotice, newNotices, type Notice, type NoticeSource } from "@/lib/notices";
import {
  addNotices,
  fetchNotices,
  loadNotices,
  loadSources,
  NOTICES_CHANGED,
  saveSources,
} from "@/lib/notices-store";
import { showNoticeNotification } from "@/lib/notify";
import { toast } from "sonner";

export interface NoticesApi {
  notices: Notice[];
  sources: NoticeSource[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  addManual: (input: { title: string; date: string; url: string; instituteId: string }) => void;
  setSources: (sources: NoticeSource[]) => void;
}

export function useNotices(instituteId: string): NoticesApi {
  const [notices, setNotices] = useState<Notice[]>(() => loadNotices());
  const [sources, setSourceState] = useState<NoticeSource[]>(() => loadSources());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const sync = () => {
      setNotices(loadNotices());
      setSourceState(loadSources());
    };
    window.addEventListener(NOTICES_CHANGED, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(NOTICES_CHANGED, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setSources = useCallback((next: NoticeSource[]) => {
    saveSources(next);
    setSourceState(next);
    toast.success("Notice source saved");
  }, []);

  const refresh = useCallback(async () => {
    const active = loadSources().filter((s) => s.instituteId === instituteId);
    if (active.length === 0) {
      setError("এই পলিটেকনিকের জন্য কোনো notice link নেই / No notice source configured");
      return;
    }
    setLoading(true);
    setError("");
    const found: Notice[] = [];
    let failed = false;
    for (const source of active) {
      try {
        found.push(...(await fetchNotices(source)));
      } catch {
        failed = true;
      }
    }
    if (found.length === 0) {
      setError(failed ? "নোটিশ আনা যায় ni — পরে আবার চেষ্টা করুন" : "কোনো নোটিশ পাওয়া যায় ni");
    } else {
      const fresh = newNotices(loadNotices(), found);
      addNotices(found);
      for (const n of fresh.slice(0, 3)) {
        showNoticeNotification("New notice / নতুন নোটিশ", n.title, n.url);
      }
      if (fresh.length > 0) toast.success(`${fresh.length} টি নতুন নোটিশ`);
    }
    setLoading(false);
  }, [instituteId]);

  const addManual = useCallback(
    (input: { title: string; date: string; url: string; instituteId: string }) => {
      addNotices([makeManualNotice(input)]);
      toast.success("Notice added");
    },
    [],
  );

  return { notices, sources, loading, error, refresh, addManual, setSources };
}
