import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.7";
import {
  dueReminders,
  findRoutine,
  type ReminderProfile,
  type ReminderRoutine,
} from "./reminders.ts";

Deno.serve(async (req) => {
  // Cron calls with the service-role key; a caller JWT would also work via RLS.
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.includes(secret)) return new Response("Unauthorized", { status: 401 });

  const url = Deno.env.get("SUPABASE_URL")!;
  const publicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const privateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  const subject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@sohoj-rasta.app";
  if (!publicKey || !privateKey) {
    return new Response(JSON.stringify({ error: "VAPID keys not configured" }), { status: 503 });
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);

  const db = createClient(url, secret, { auth: { persistSession: false } });
  const { data: profiles } = await db
    .from("student_profiles")
    .select("*")
    .eq("reminder_enabled", true);
  const { data: routinesRaw } = await db
    .from("routines")
    .select("institute_id, semester, shift, department, data");
  const { data: subs } = await db.from("push_subscriptions").select("*");

  const routines = (routinesRaw ?? []).map((r: Record<string, unknown>) => {
    const data = (r.data ?? {}) as Record<string, unknown>;
    return {
      instituteId: r.institute_id,
      ...data,
    } as ReminderRoutine & { instituteId: string };
  });
  const subscriptions = subs ?? [];
  let sent = 0;

  for (const p of profiles ?? []) {
    const row = p as Record<string, unknown>;
    const profile: ReminderProfile = {
      semester: Number(row.semester),
      group: String(row.group ?? ""),
      shift: String(row.shift ?? "Morning"),
      department: String(row.department ?? ""),
    };
    const instituteRoutines = routines.filter(
      (r) => r.instituteId === row.institute_id,
    ) as ReminderRoutine[];
    const routine = findRoutine(profile, instituteRoutines);
    if (!routine) continue;
    const reminders = dueReminders(profile, routine, new Date());
    if (reminders.length === 0) continue;

    const mine = subscriptions.filter((s: Record<string, unknown>) => s.user_id === row.user_id);
    if (mine.length === 0) continue;

    for (const reminder of reminders) {
      const dayKey = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Dhaka",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());
      const classKey = `${dayKey}:${reminder.classKey}`;
      const { error: logError } = await db.from("notification_log").insert({
        user_id: row.user_id,
        kind: reminder.kind,
        class_key: classKey,
      });
      if (logError) continue; // duplicate or error — never send twice

      for (const sub of mine) {
        const s = sub as Record<string, unknown>;
        try {
          await webpush.sendNotification(
            {
              endpoint: String(s.endpoint),
              keys: { p256dh: String(s.p256dh), auth: String(s.auth) },
            },
            JSON.stringify({
              title: reminder.title,
              body: reminder.body,
              url: reminder.url,
              tag: `${reminder.kind}-${reminder.classKey}`,
            }),
          );
          sent++;
        } catch (e) {
          const status = (e as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) {
            await db.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
          }
        }
      }
    }
  }

  return new Response(JSON.stringify({ sent }), {
    headers: { "content-type": "application/json" },
  });
});
