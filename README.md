# Sohoj Rasta (সহজ রাস্তা)

Smart, offline-first campus navigator for Bangladesh polytechnic students. Find rooms, see your class routine, get class-journey push notifications — works without GPS and keeps working without internet.

**Live app**: https://sohozrasta.lovable.app

**Pilot target**: Rajshahi Govt. Polytechnic Institute (20–30 students)

## Development

```sh
npm i
npm run dev          # local dev server
npm test             # Vitest unit tests
npx tsc --noEmit     # typecheck
npm run build        # production build
```

## Architecture

| Layer                | Where                                                                                                               | Why                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Pure demo/data logic | `src/lib/campus-data.ts`, `routine.ts`, `teachers.ts`, `student.ts`, `feedback.ts`, `stats.ts`, `routine-import.ts` | Testable, no UI/DB.                                                                          |
| Supabase repos       | `src/lib/repo/*` (loose `SupabaseClient` from `client.ts`)                                                          | Generated types only know `profiles`; repos own row↔model mapping.                           |
| Offline cache        | `src/lib/cache.ts` (stale-while-revalidate), `src/lib/resources.ts` (`startSync()`)                                 | Last-known data renders instantly; Supabase revalidates in background; offline stays usable. |
| Auth & roles         | `src/hooks/use-auth.tsx`, `src/hooks/use-admin-role.ts`, `src/lib/admin.ts`                                         | Lovable Cloud auth; admin membership in `institute_admins`; RLS is the real enforcement.     |
| UI                   | `src/components/sohoj/*`, `src/routes/*`                                                                            | Bangla + English mix; no redesign of the original screens.                                   |
| Global feedback      | `FeedbackHost` in `__root.tsx` + `openFeedback()`                                                                   | Any card / error boundary can prefill and open one dialog.                                   |
| Push                 | `src/lib/notify.ts` (local fallback), `src/lib/analytics.ts`, `public/sw.js`                                        | Web Push when VAPID is configured, local timers otherwise.                                   |

Writes are optimistic: local cache + resource update first, Supabase call fire-and-forget, failures swallowed so offline never shows a blank screen. A React error boundary plus the TanStack root error component guarantee a friendly message with a **Report this** button.

## Supabase setup

Apply the migrations in Lovable Cloud / Supabase (in order):

1. `supabase/migrations/20261122000001_campus_data.sql` — institutes, buildings, rooms, routines, teachers, admins, student_profiles, RLS + SECURITY DEFINER role helpers, max-5-admins trigger.
2. `supabase/migrations/20261122000003_push_notifications.sql` — push_subscriptions, notification_log, pg_cron schedule.
3. `supabase/migrations/20261122000004_pilot.sql` — feedback, usage_events + RLS (admins read only their institute).

Seed the campus data once (idempotent upserts; requires a service-role key):

```sh
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/seed-supabase.ts
```

> Data migrations/seeding are applied through Lovable Cloud. Do not edit `src/integrations/supabase/*` or `src/routeTree.gen.ts`.

## Environment variables

| Name                                                              | Where                          | Purpose                                                                |
| ----------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`              | client (.env)                  | Supabase client.                                                       |
| `VITE_VAPID_PUBLIC_KEY`                                           | client (.env)                  | Web Push subscribe. Without it, reminders use the local-only fallback. |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`  | Edge Function secrets          | Service role stays server-side only.                                   |
| `LOVABLE_API_KEY`, optional `AI_MODEL`                            | `parse-routine` secrets        | Image OCR via Lovable AI gateway. Never in client code.                |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, optional `VAPID_SUBJECT` | `send-class-reminders` secrets | Push signing. Generate with `npx web-push generate-vapid-keys`.        |

## Edge Functions

- `parse-routine` — JWT + `institute_admins` check, 4MB limit, 10 req/min, strict JSON validation in pure `validate.ts`. Returns a friendly error when the AI key is missing.
- `send-class-reminders` — called by pg_cron every 5 min; computes due reminders in pure `reminders.ts`, dedupes via `notification_log`, removes 404/410 subscriptions.

Deploy both in Lovable Cloud and set the secrets above. pg_cron + pg_net must be enabled; the cron command reads `app.settings.functions_url` and `app.settings.service_role_key` — set those via Lovable (never hardcode secrets in SQL). If extensions are unavailable, hit the function URL externally on a schedule with the service-role header.

## Pilot checklist (Rajshahi Govt. Polytechnic, 20–30 students)

1. Apply all three migrations; deploy both Edge Functions with secrets; run the seed script.
2. Add the institute admins (max 5/institute) and verify the super-admin email.
3. On 3–5 devices: sign in → set Department / Semester / Group / Shift → import a routine (CSV or image) → review warnings → publish → Undo works.
4. Enable reminders; confirm a real "Leave now" push arrives with the app closed; tap opens `/student`. On iOS, add the PWA to Home Screen first.
5. Give feedback from home and student pages (<20 s); confirm it appears in Admin Panel → Feedback with the right category filter.
6. Admin Panel → Stats: check active students, QR scans, top searched rooms, reminder opt-ins for 7 / 30 days.
7. Switch a device offline (airplane mode): app still opens from cache and edits queue up; network returns → data revalidates.
8. Force a render error (dev only): friendly Bangla/English screen with **Report this** appears, never a blank page.
