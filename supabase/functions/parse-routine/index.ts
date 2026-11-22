import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { extractJson, validateOcrPayload } from "./validate.ts";

const MAX_BYTES = 4 * 1024 * 1024;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 10;
const rate = new Map<string, { count: number; at: number }>();

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({}, 204);
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ error: "Sign in first" }, 401);

  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const aiKey = Deno.env.get("LOVABLE_API_KEY");
  const model = Deno.env.get("AI_MODEL") ?? "google/gemini-2.5-flash";

  const caller = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userError } = await caller.auth.getUser(token);
  if (userError || !userData.user) return json({ error: "Invalid session" }, 401);
  const user = userData.user;

  const adminDb = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: roleRows } = await adminDb
    .from("institute_admins")
    .select("institute_id, role")
    .eq("user_id", user.id);
  const role = roleRows?.[0] as { institute_id: string | null; role: string } | undefined;
  if (!role) return json({ error: "Admin access required" }, 403);

  // Basic per-user rate limit.
  const now = Date.now();
  const hit = rate.get(user.id);
  if (hit && now - hit.at < RATE_WINDOW_MS && hit.count >= RATE_MAX)
    return json({ error: "Too many requests — try again in a minute" }, 429);
  rate.set(user.id, { count: hit && now - hit.at < RATE_WINDOW_MS ? hit.count + 1 : 1, at: now });

  if (!aiKey)
    return json(
      { error: "AI key not configured. Add LOVABLE_API_KEY to Edge Function secrets." },
      503,
    );

  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BYTES) return json({ error: "Image too large (max 4MB)" }, 413);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return json({ error: "Invalid upload" }, 400);
  }
  const file = form.get("file");
  const instituteId = String(form.get("institute_id") ?? "");
  const department = String(form.get("department") ?? "");
  const semester = String(form.get("semester") ?? "");
  const group = String(form.get("group") ?? "");
  const shift = String(form.get("shift") ?? "");
  if (!(file instanceof File)) return json({ error: "Image file required" }, 400);
  if (file.size > MAX_BYTES) return json({ error: "Image too large (max 4MB)" }, 413);
  if (!instituteId || !department || !semester || !shift)
    return json({ error: "Institute, department, semester and shift are required" }, 400);
  if (role.role !== "super_admin" && role.institute_id !== instituteId)
    return json({ error: "Not allowed for this institute" }, 403);

  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  const base64 = btoa(binary);

  const prompt = `You read a university class routine image. Return STRICT JSON only, no prose, no markdown.
Shape:
{"entries":[{"day":"Sunday","period":1,"endPeriod":1,"code":"28533","subject":"IT Support Services","teacher":"MD. SORIAT ULLAH","acronym":"MSU","room":"1305"}],"periods":[{"id":1,"label":"1","time":"8:00-8:45"}],"classStart":"27-09-2026","classLoad":34}
Rules: day must be Sunday..Saturday. period 1..12. Merge a class spanning multiple periods using endPeriod. Use "" for unknown fields. Include every visible class. Department: ${department}, Semester: ${semester}, Group: ${group}, Shift: ${shift}.`;

  const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${aiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "You output strict JSON only." },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:${file.type};base64,${base64}` } },
          ],
        },
      ],
      temperature: 0,
    }),
  });

  if (!aiRes.ok) {
    const detail = await aiRes.text();
    return json(
      { error: `AI request failed (${aiRes.status})`, detail: detail.slice(0, 200) },
      502,
    );
  }

  const aiJson = await aiRes.json();
  const content = aiJson?.choices?.[0]?.message?.content;
  if (typeof content !== "string") return json({ error: "AI returned no content" }, 502);

  try {
    const parsed = validateOcrPayload(extractJson(content));
    if (!parsed.ok) return json({ error: parsed.error }, 422);
    return json({ data: parsed.data });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Invalid AI JSON" }, 422);
  }
});
