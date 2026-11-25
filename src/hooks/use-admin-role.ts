import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { adminsResource } from "@/lib/resources";
import type { AdminAccount } from "@/lib/admin";

export interface AdminRole {
  isAdmin: boolean;
  isSuper: boolean;
  allowedInstituteIds: string[];
  admins: AdminAccount[];
}

const EMPTY: AdminRole = { isAdmin: false, isSuper: false, allowedInstituteIds: [], admins: [] };

/** UI-level role from institute_admins; RLS remains the real enforcement. */
export function useAdminRole(): AdminRole {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminAccount[]>([]);

  useEffect(() => {
    setAdmins(adminsResource.get());
    return adminsResource.subscribe(setAdmins);
  }, []);

  return useMemo(() => {
    const email = (user?.email ?? "").trim().toLowerCase();
    if (!email) return EMPTY;
    const mine = admins.filter((a) => a.email.trim().toLowerCase() === email);
    if (mine.length === 0) return EMPTY;
    const isSuper = mine.some((a) => a.role === "super");
    return {
      isAdmin: true,
      isSuper,
      allowedInstituteIds: isSuper
        ? admins.map((a) => a.instituteId).filter((id) => id !== "all")
        : mine.map((a) => a.instituteId).filter((id) => id !== "all"),
      admins,
    };
  }, [admins, user?.email]);
}
