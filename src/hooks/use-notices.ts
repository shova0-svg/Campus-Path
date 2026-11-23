import { useCallback, useEffect, useState } from "react";
import { makeManualNotice, type Notice, type NoticeSource } from "@/lib/notices";
import {
  addNotices,
  fetchNotices,
  loadNotices,
  loadSources,
  NOTICES_CHANGED,
  saveNotices,
  saveSources,
} from "@/lib/notices-store";
import {
  addNoticesRemote,
  listAllNotices,
  listApprovedNotices,
  listNoticeSources,
  removeNotice,
  removeNoticeSource,
  saveNoticeSource,
  setNoticeStatus,
  updateNotice,
  type StoredNotice,
} from "@/lib/repo/notices";
import { toast } from "sonner";

export interface NoticesApi {
  notices: Notice[];
  all: StoredNotice[];
  sources: NoticeSource[];
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  fetchSource: () => Promise<void>;
  addManual: (input: {
    title: string;
    date: string;
    url: string;
    instituteId: string;
  }) => Promise<void>;
  setSources: (sources: NoticeSource[]) => void;
  approve: (id: string, status: "approved" | "rejected") => Promise<void>;
  edit: (
    id: string,
    patch: { title?: string; url?: string; published_date?: string },
  ) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export function useNotices(instituteId: string): NoticesApi {
  const [notices, setNotices] = useState<Notice[]>(() => loadNotices());
  const [all, setAll] = useState<StoredNotice[]>([]);
  const [sources, setSourceState] = useState<NoticeSource[]>(() => loadSources());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const approved = await listApprovedNotices(instituteId).catch(() => []);
    if (approved.length > 0) {
      setNotices(approved);
      saveNotices(approved);
    }
    const adminRows = await listAllNotices(instituteId).catch(() => []);
    setAll(adminRows);
    const remoteSources = await listNoticeSources().catch(() => []);
    if (remoteSources.length > 0) {
      setSourceState(remoteSources);
      saveSources(remoteSources);
    }
  }, [instituteId]);

  useEffect(() => {
    void load();
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
  }, [load]);

  const setSources = useCallback((next: NoticeSource[]) => {
    saveSources(next);
    setSourceState(next);
    for (const source of next) void saveNoticeSource(source).catch(() => {});
    toast.success("Notice source saved");
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    await load();
    if (notices.length === 0) setError("এখনো কোনো নোটিশ নেই / No notices yet");
    setLoading(false);
  }, [load, notices.length]);

  const fetchSource = useCallback(async () => {
    const active = loadSources().filter((s) => s.instituteId === instituteId);
    if (active.length === 0) {
      setError("এই পলিটেকনিকের জন্য কোনো notice link নেই / No notice source configured");
      return;
    }
    setLoading(true);
    setError("");
    const found: Notice[] = [];
    for (const source of active) {
      try {
        found.push(...(await fetchNotices(source)));
      } catch {
        setError("নোটিশ আনা যায় ni — পরে আবার চেষ্টা করুন");
      }
    }
    if (found.length > 0) {
      addNotices(found);
      const added = await addNoticesRemote(found).catch(() => 0);
      toast.success(
        `${found.length} টি নোটিশ পাওয়া গেছে (${added} টি approval-er jonno pathano hoyeche)`,
      );
    }
    await load();
    setLoading(false);
  }, [instituteId, load]);

  const addManual = useCallback(
    async (input: { title: string; date: string; url: string; instituteId: string }) => {
      const notice = makeManualNotice(input);
      addNotices([notice]);
      const added = await addNoticesRemote([notice]).catch(() => 0);
      toast.success(added ? "Notice added — approval-er jonno pathano hoyeche" : "Notice added");
      await load();
    },
    [load],
  );

  const approve = useCallback(
    async (id: string, status: "approved" | "rejected") => {
      await setNoticeStatus(id, status).catch(() => {});
      await load();
      toast.success(status === "approved" ? "Notice approved — push jabe" : "Notice rejected");
    },
    [load],
  );

  const edit = useCallback(
    async (id: string, patch: { title?: string; url?: string; published_date?: string }) => {
      await updateNotice(id, patch).catch(() => {});
      await load();
      toast.success("Notice updated");
    },
    [load],
  );

  const remove = useCallback(
    async (id: string) => {
      await removeNotice(id).catch(() => {});
      await load();
      toast.success("Notice removed");
    },
    [load],
  );

  // Keep the type complete without changing callers that still pass removed sources.
  void removeNoticeSource;

  return {
    notices,
    all,
    sources,
    loading,
    error,
    refresh,
    fetchSource,
    addManual,
    setSources,
    approve,
    edit,
    remove,
  };
}
