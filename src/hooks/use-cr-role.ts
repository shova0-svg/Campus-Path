import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { myCrAssignments, type CrRow } from "@/lib/repo/crs";

export interface CrRole {
  loading: boolean;
  assignments: CrRow[];
  isCr: boolean;
}

export function useCrRole(): CrRole {
  const { user, loading: authLoading } = useAuth();
  const [assignments, setAssignments] = useState<CrRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setAssignments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    void myCrAssignments()
      .then((rows) => setAssignments(rows ?? []))
      .catch(() => setAssignments([]))
      .finally(() => setLoading(false));
  }, [authLoading, user?.id]);

  return { loading, assignments, isCr: assignments.length > 0 };
}
