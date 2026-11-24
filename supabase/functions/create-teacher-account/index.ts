import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({}, 204);
  if (req.method !== "POST") return json({ error: "POST required" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  const serviceKey = Deno.env.get("CRON_DB_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!anonKey || !serviceKey) return json({ error: "Server keys not configured" }, 503);

  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ error: "Sign in first" }, 401);
  const callerClient = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: authError } = await callerClient.auth.getUser(token);
  if (authError || !userData.user) return json({ error: "Invalid session" }, 401);

  const db = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: roleRows } = await db
    .from("institute_admins")
    .select("role, institute_id")
    .eq("user_id", userData.user.id);
  const role = roleRows?.[0] as { role: string; institute_id: string | null } | undefined;
  if (!role) return json({ error: "Admin access required" }, 403);

  let input: { email?: string; teacherName?: string; instituteId?: string; directoryId?: string };
  try {
    input = await req.json();
  } catch {
    return json({ error: "Invalid request" }, 400);
  }
  const email = String(input.email ?? "")
    .trim()
    .toLowerCase();
  const teacherName = String(input.teacherName ?? "").trim();
  const instituteId = String(input.instituteId ?? "").trim();
  if (!email.includes("@") || !teacherName || !instituteId)
    return json({ error: "Email, teacher and institute are required" }, 400);
  if (role.role !== "super_admin" && role.institute_id && role.institute_id !== instituteId)
    return json({ error: "Not allowed for this institute" }, 403);

  // Generate a temporary password; shown to the admin once, never stored in plain text.
  const password = `Ts-${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}aA!`;
  const created = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: teacherName, role: "teacher" },
    }),
  });
  if (!created.ok) {
    const detail = await created.text();
    return json(
      {
        error: detail.includes("already") ? "Email already registered" : "Could not create account",
      },
      400,
    );
  }
  const createdUser = (await created.json()) as { id?: string };
  if (!createdUser.id) return json({ error: "Could not create account" }, 400);

  const { error: profileError } = await db.from("teacher_profiles").upsert({
    user_id: createdUser.id,
    institute_id: instituteId,
    teacher_name: teacherName,
    ...(input.directoryId ? { directory_id: String(input.directoryId) } : {}),
    reminder_enabled: true,
  });
  if (profileError) return json({ error: "Account created but profile link failed" }, 500);

  return json({ ok: true, email, password, teacherName });
});
