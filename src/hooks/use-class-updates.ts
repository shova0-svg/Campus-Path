import { safeGet, safeSet } from "@/lib/storage";
import { useCallback, useEffect, useMemo, useState } from "react";
import { classKeyOf, sortUpdates, type ClassKey, type ClassUpdate } from "@/lib/class-updates";
import { classUpdatesResource } from "@/lib/repo/classUpdates";
import { parseShift, type StudentProfile } from "@/lib/student";

const SEEN_KEY = "class-updates-seen-v1";

function readSeen(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(safeGet(SEEN_KEY) ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

export function useClassUpdates(profile: StudentProfile | null) {
  const key = useMemo<ClassKey | null>(
    () =>
      profile
        ? {
            instituteId: profile.instituteId,
            department: profile.department,
            semester: profile.semester,
            shift: parseShift(profile.shift),
          }
        : null,
    [profile?.instituteId, profile?.department, profile?.semester, profile?.shift],
  );

  const resource = useMemo(() => (key ? classUpdatesResource(key) : null), [key]);
  const [updates, setUpdates] = useState<ClassUpdate[]>(() => resource?.get() ?? []);
  const [seen, setSeen] = useState<Record<string, string>>(() => readSeen());

  useEffect(() => {
    if (!resource) {
      setUpdates([]);
      return;
    }
    setUpdates(resource.get());
    void resource.refresh();
    return resource.subscribe(setUpdates);
  }, [resource]);

  const sorted = useMemo(() => sortUpdates(updates), [updates]);
  const keyString = key ? classKeyOf(key) : "";
  const lastSeen = seen[keyString] ?? "";
  const unreadCount = sorted.filter((u) => u.createdAt > lastSeen).length;

  const markSeen = useCallback(() => {
    if (!keyString) return;
    const next = { ...readSeen(), [keyString]: new Date().toISOString() };
    try {
      safeSet(SEEN_KEY, JSON.stringify(next));
    } catch {
      /* storage blocked */
    }
    setSeen(next);
  }, [keyString]);

  return { updates: sorted, unreadCount, markSeen, classKey: key };
}
