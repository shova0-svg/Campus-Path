<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.

<!-- LOVABLE:END -->

<!-- AGENT-MEMORY:BEGIN -->

- Campus data, search and route generation live in `src/lib/campus-data.ts` as pure functions; UI pieces in `src/components/sohoj/`. Why: keeps the demo data testable (`src/test/campus-data.test.ts`).
- Accounts use Lovable Cloud auth (email/password, Google, Lovable) via the single `AuthProvider` in `src/hooks/use-auth.tsx`; display names live in `public.profiles` (filled by a signup trigger). Admin mode = signed-in email checked against the admin list in `src/lib/admin.ts`. Rooms, routines and admin lists still live in localStorage. Why: real sign-in first; moving campus data to Cloud is a separate step.

<!-- AGENT-MEMORY:END -->

<!-- PHASE1:BEGIN -->

## Supabase data sync (Phase 1)

- Schema: `supabase/migrations/20261122000001_campus_data.sql` (apply in Lovable Cloud / Supabase).
- One-time idempotent seed: `npx tsx scripts/seed-supabase.ts` (needs `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in the environment; publishable key works only where RLS allows writes).
- Repos: `src/lib/repo/*` (Supabase CRUD). Cache: `src/lib/cache.ts` (stale-while-revalidate, offline-safe). Resources: `src/lib/resources.ts`.
- Assumptions: code seeds use stable `text` ids so upserts are idempotent; public read tables allow anon SELECT (app is login-gated anyway, and offline cache still works).
- Image OCR Edge Function: `supabase/functions/parse-routine` — deploy in Lovable Cloud, set secrets `LOVABLE_API_KEY` (never in client), optionally `AI_MODEL`; max 4MB upload, JWT + `institute_admins` check, 10 req/min per admin. Without the key it returns a friendly error.

<!-- PHASE1:END -->

<!-- PHASE3:BEGIN -->

## Web push class reminders (Phase 3)

- Schema: `supabase/migrations/20261122000003_push_notifications.sql` — `push_subscriptions` (RLS: own rows only), `notification_log` (unique `(user_id, kind, class_key)` dedupe), and a pg_cron job calling `send-class-reminders` every 5 minutes.
- VAPID keys generate: `npx web-push generate-vapid-keys` (or `openssl ecparam -name prime256v1 -genkey ...` + base64url). Put **public** key in client env `VITE_VAPID_PUBLIC_KEY`; put **private** key in Edge Function secret `VAPID_PRIVATE_KEY` (also set `VAPID_PUBLIC_KEY`, optional `VAPID_SUBJECT`). Never commit the private key.
- Edge Function: `supabase/functions/send-class-reminders` — deploy in Lovable Cloud. Secrets needed: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, optional `VAPID_SUBJECT`. Pure logic in `reminders.ts` (tested in `src/test/reminders.test.ts`). `src/lib/reminders.ts` re-exports it for the client; local `notify.ts` scheduling stays as fallback when push is unsupported.
- Cron note: pg_cron + pg_net must be enabled in Lovable Cloud. The migration reads `app.settings.functions_url` and `app.settings.service_role_key` — set these via Lovable (or harden the cron command there) since secrets must not live in SQL. If extensions are unavailable, schedule the function externally (e.g. cron-hit the URL with the service-role header).
- iOS: Web Push needs the PWA added to Home Screen; the Student page shows a hint. Without `VITE_VAPID_PUBLIC_KEY`, reminders use the local-only fallback (works only while the tab is open).
- Manual test: (1) apply migration + deploy function + set secrets, (2) sign in as a test student, set routine (CST, sem 3, group A, Morning), (3) Student page → "Enable class reminders" → allow notifications, (4) close the app / kill the tab, (5) at a scheduled time (e.g. ~5 min before class ends, or ~8 min before the next class in another building) a push arrives; (6) tapping it opens `/student`. Dedupe: a second cron run same day must not repeat the same reminder.

<!-- PHASE3:END -->

<!-- PHASE4:BEGIN -->

## Pilot readiness (Phase 4)

- Schema: `supabase/migrations/20261122000004_pilot.sql` — `feedback` (own insert, institute-admin read) + `usage_events` (own insert, institute-admin read). Only 5 events allowed: app_open, qr_scan, search, journey_view, reminder_enabled.
- Pure helpers: `src/lib/feedback.ts` (validation, `openFeedback()` event), `src/lib/stats.ts` (`aggregateUsage` with Asia/Dhaka day keys), `src/lib/analytics.ts` (`logEvent()` fire-and-forget, never throws). Tests in `src/test/pilot.test.ts`.
- One global `FeedbackHost` lives in `__root.tsx`; cards/pages/error boundary call `openFeedback({ category, message, page })` to prefill it. "Report wrong info" flags live on room cards (home), teacher cards, routine cards and the student journey.
- Admin Panel has **Feedback** (filter by category) and **Stats** (7/30-day active users, QR scans, top searched rooms, reminder opt-ins) tabs, loaded from Supabase on tab open; empty/error degrades to empty lists.
- First-visit 3-step intro (`Onboarding`, localStorage `sohoj-rasta-onboarded-v1`) + `InstallHint` (Android `beforeinstallprompt`, manual iOS hint). Global error boundary + enhanced TanStack root error component with **Report this**.
- Full architecture, env vars, migration/seed/Edge Function steps and the pilot checklist are in `README.md`.

<!-- PHASE4:END -->

## Branding (Campus Path)

- App name: **Campus Path** / **ক্যাম্পাস পাথ**; tagline "Find your way on campus" / "ক্যাম্পাসে নিজের পথ খুঁজে নিন". Colors: navy `#0B1F3A`, `#14365F`, `#081628`, gold `#C9962F` (light `#F6D98A`), ice blue `#9FD8E6`, white.
- Logos: `public/brand/campus-path-icon.svg` + `public/brand/campus-path-logo-light.svg` are user-supplied — never redraw or edit. In-app wordmark is live text in `src/components/brand/Logo.tsx`; the light horizontal SVG is only for README / og:image / print.
- Regenerate icons with `npm run icons` (`scripts/generate-icons.mjs`, `sharp` devDependency) → `public/icons/*`, `public/og-image.png`, `public/favicon.svg`.
- IMPORTANT: do not rename `sohoj-*` localStorage keys, `SOHOJ1|` QR prefix, `sohoj:*` events, Supabase identifiers or `src/components/sohoj/*` paths — those are data/QR compat identifiers, not brand text.

## Teacher admin saves

- Admin Panel → Teachers creates/updates teachers in the **panel's selected institute** (not the home page's), generates a stable `id` for new teachers (DB `teachers.id` is a required text PK), awaits the upsert, and only toasts success after the DB write. Failed writes show a bilingual error toast and keep the editor open; the local cache is never restamped across institutes.
- `/teachers` no longer crashes on a cached/DB row with a missing `facultyKey`: `groupTeachers()` falls back to department/`other`, and `fromRow()` fills required fields when `data` is empty. `teachersResource` merges code-seeded teachers with remote rows, so signed-in users still see the directory when the remote table is empty. `public/sw.js` cache bumped to v8.

## Teacher identity

- 1st-shift routine notices use English names; `src/data/teacher-aliases.ts` holds manually verified English→Bangla directory aliases. 2nd-shift teachers match by printed phone (`normalizePhone`).
- 6 names remain unmatched/ambiguous (`MD. MOHOSIN`, `SAMROZ NAHAR`, `ANJUMAN ARA`, `MD. SORIAT ULLAH`, `SYEDA SADIKA AKHTER JAHAN`, `MD. MOHON ALI`) — see `UNCONFIRMED_ALIASES`; never auto-match, never use acronyms as identity.

## Campus AI (Phase 1 — read-only)

- Edge Function `campus-ai/` verifies the caller JWT, builds a **user-JWT** Supabase client (never service role), checks bans, increments `ai_usage` (atomic RPC, 20/day via `AI_DAILY_LIMIT`) and **refunds** it on provider-side failures (`ai_usage_refund`). Kill switch `AI_ENABLED=false`. Provider wrapper `campus-ai/provider.ts` calls **OpenRouter chat-completions** (`OPENROUTER_API_KEY`, `AI_MODEL` — both required, no default model; e.g. `google/gemini-2.5-flash`); provider 429 returns a bilingual busy answer and refunds the question. Key is sent as a Bearer header, never logged or stored in the repo.
- Fixed tools only: `get_my_routine`, `get_class_updates`, `find_teacher`, `find_room_or_location`, `get_notices`, `search_shop`, `get_my_notifications`. Institute/class scope comes from `student_profiles` in the function; tools with `using(true)` RLS are filtered server-side. Max 4 tool calls, 700 max_tokens, 18s timeout, last 6 messages, deep-link whitelist in `campus-ai/shared.ts`. No phone numbers / personal data; shop returns product links only.
- Required secrets (names only): `OPENROUTER_API_KEY` and `AI_MODEL` (both set in Supabase; missing either returns the existing 503 without counting usage). Optional: `AI_DAILY_LIMIT`, `AI_ENABLED`. Response: `{answer, sources[], deepLink?}`. Verified: missing key increments nothing (usage 0); increment→refund restores 1→0.
- Live checks (6/6): cross-institute scope, injection-as-data, unauth 401, banned 403, rate limit 429 on 21st question. Secrets `OPENROUTER_API_KEY` + `AI_MODEL` set in Supabase. Final 15-question audit at 4.2s spacing: model `google/gemini-2.5-flash`, avg latency 1774ms, **0 provider 429s**, **14/15 strict pass** (Q6 "sports update" mentioned an unrelated general update instead of the exact couldn't-find phrase — reported honestly; a prior run scored 15/15, so this path is non-deterministic). Tool results redact phone-like numbers and instruction-like phrases; routine tool orders by `updated_at desc` and reads 20 routines. `?debug=1` returns model/toolCalls/latency for audits.

## Campus AI date handling

- `supabase/functions/_shared/dhaka-time.ts` is the single pure Dhaka (UTC+6, no DST) date module with injectable `now`: `nowDhaka`, `resolveWhen`, `nextClassDayAfter`, Bangla/English labels, Sunday–Thursday class week (Friday/Saturday = no class). Unit tests: `src/test/dhaka-time.test.ts` (12 cases incl. boundaries).
- The model never computes dates. Every date-aware tool takes structured `when`; missing `when` triggers a repair round. `get_my_routine` also has `mode:"now_and_next"` (current block / next block / next class day's first block). Every date-aware result includes resolved iso, weekday names, labels, relative, isClassDay, nextClassDay. A fresh CURRENT TIME block is injected into the system prompt per request.
- Fixed clock for local tests only: `AI_FIXED_NOW` (ISO with +06:00 offset) is honored ONLY when `AI_ALLOW_FIXED_NOW=true`; production ignores both unless that flag is explicitly set. `AI_MAX_TOKENS_CAMPUS` (700) / `AI_MAX_TOKENS_GENERAL` (1000) are env caps; OpenRouter credits must cover the prompt+max_tokens or provider returns 402.

## Campus AI hybrid + ops (latest)

- Env-only provider config (names only): `AI_BASE_URL` (`https://openrouter.ai/api/v1`), `AI_API_KEY`, `AI_MODEL` (no hardcoded default), optional `AI_FALLBACK_MODEL`, `AI_ENABLED`, `AI_DAILY_LIMIT` (30), `AI_GLOBAL_DAILY_LIMIT`, `AI_MAX_INPUT_CHARS` (1000), `AI_MAX_TOKENS_GENERAL` (1000). To switch models: `supabase secrets set AI_MODEL=<provider/model-id>` — no code change.
- Response adds `mode: campus|general|mixed`; campus facts come only from the 7 read-only tools, general questions use model knowledge. `sources[]` only for campus parts. Deep-link whitelist, user-JWT client, ban check, RLS and kill switch unchanged.
- New migration `20261126000017_ai_global_limit.sql`: atomic global daily counter + `ai_request_log` (hashed user id, mode, model, tokens, latency, status — no message text/key).
- Chat UI: mode badges, bilingual disclaimer, safe bold/list/code rendering (no raw HTML), Clear chat, Copy answer, 1000-char counter.
- Real-model audit (30 questions): 29/30 pass, 0 leaks, 0 campus-fact-from-own-knowledge, avg 1793ms, avg 912 in / 65 out tokens, provider cost field none, est $0.0437/100 messages → **RELEASE**. Limits/global/kill-switch/provider-failure/cross-institute checks 5/5 pass.

## Campus AI chat UI (Phase 2)

- `src/components/sohoj/AskCampusAi.tsx` renders a floating **Ask AI** button on Home only, above the bottom tab bar + safe area. `src/routes/index.tsx` mounts it. No new tab, no edge-function security changes.
- Chat sheet: suggested chips, last-6-message history, abort/cancel, source chips, whitelisted deep links via `campus-ai/shared.ts`, thumbs up/down + "report wrong answer" into `public.feedback` (existing RLS), disclaimer, offline disabled, `VITE_AI_ENABLED=false` kill switch, theme tokens + bilingual labels. Live at 390px: button above tab bar (738 < 769), absent on other screens, answer + sources visible, feedback row inserted.

## Campus AI answer-quality review (Phase 3)

- 30-question audit (Bangla/English/Banglish, 8 tricky) against a temporary `qa-*` test institute with incomplete routine + outdated CR update; all test data deleted afterwards. Final run: `google/gemini-2.5-flash`, avg latency 2337ms, 0 provider 429, 31,267 tokens (in 29,282 / out 1,985; ~$0.0137 at assumed $0.30/$2.50 per M), **24/30 strict pass, 1 fact failure → RELEASE** (rule: >2 fact failures blocks release).
- Fixes applied after earlier failing runs: strict day mapping (kal vs porshu), tool routing rules, follow-up room routing, Bangla room synonyms (ল্যাব/অফিস), routine ordering/limit, phone+instruction redaction, debug-only usage/token trace. Known residual non-fact issues: some strict checker variants (Bangla department names) and tool-selection on a few follow-ups.

## Campus AI chat reliability (Phase 4)

- Server: every failure returns `{error:{code,message_bn,message_en,request_id}}`; `?debug=1` adds `attempts`/`detail` (never keys). History is normalized server-side (`_shared/chat-history.ts`) and the client sends only completed user+assistant pairs. Client timeout 35s, one close X, Retry + Ref ID on failed turns, updated bilingual disclaimer, plain-text-safe math rendering. `public/sw.js` cache bumped to v6.
- New read-only tool `get_live_classes` resolves "what is running now" from server Dhaka time + institute routines (`_shared/seed-routines.ts` covers code-seeded RPI data); DB `data.periods` is an array of `{id,time}`, normalized in the tool. `campus-ai/date-intent.ts` converts the user's own day words to structured `when` on the server — the model is told never to pass date arguments. Date tools no longer expose a `when` parameter to the model.
- Provider failover: `AI_BASE_URL`/`AI_API_KEY`/`AI_MODEL` plus optional `AI_FALLBACK_*`; health/cooldown in `public.ai_provider_state` via `ai_provider_state_get`/`ai_provider_state_set` (authenticated RPCs only). 429 cooldown 8s, 5xx 30s, other 4xx 300s; tool messages now carry `name` so OpenAI-harmony models (gpt-oss) work. Provider-state writes never store message text or keys.
- Live config uses a user-supplied Groq free key: primary `openai/gpt-oss-20b`, fallback `qwen/qwen3.8-27b`. Groq's free tier allows 200k tokens/model/day — repeated audits exhausted both models on 26 Nov 2026, so live calls returned the structured busy error until the quota reset; switch `AI_MODEL` in Supabase Secrets to any available tool-capable model to resume. Do not paste keys into the repo or docs.
- Verified live before quota exhaustion: exact 4-turn sequence 4/4 (math + general + campus mode, alternating roles, no failed turns in history), fixed-clock live classes at Thu 11:07 returned Engineering Drawing/21011/2305, Python/28531/2306, Business Communication/25831, Sensor & IoT/28563/1305; Friday/Saturday no-class + next class day, midnight rollover and cross-institute isolation. Local suite: 206/206 tests pass.

## Shop images

- `src/lib/shop-image.ts` is the single URL helper: accepts storage paths, `/shop-images/...` prefixes and legacy full URLs without double-prefixing. `imageUrl()` in repo delegates to it. `ShopImage` reserves aspect ratio, shows skeleton while loading and an icon placeholder on error; used on cards, detail carousel, My Shop and seller page.
- Upload validates blob size/MIME and uploads with the real type (webp/png/jpg) instead of always labeling webp; a failed upload aborts the product save with a bilingual error and keeps form data. Migration `20261126000014_shop_image_paths_repair.sql` normalizes legacy full-URL values (dry run: 0 rows). Storage RLS unchanged.

## Campus Shop storefront (Phase 4)

- Migrations `20261126000012_shop_wishlist.sql` + `...13_shop_wishlist_default.sql`: per-user wishlist with `user_id DEFAULT auth.uid()`, RLS owner-only. No other RLS/request rules changed in this phase.
- `/shop` redesigned: sticky search + segments (Home/Wishlist/Requests/My Shop), category icon row, New arrivals / Under ৳500 / Old Books / Recently viewed rails, main grid, filter bottom sheet, floating +Sell button. Product detail: zoomable carousel, clickable seller card → `/shop/seller/$sellerId`, similar products, share, sticky Wishlist/Contact/Request bar. `/shop/wishlist` and public seller page added. Wishlist RLS check (2 users + anon): 6/6 passed.

## Campus Shop purchase requests (Phase 3)

- Migrations `20261126000008_shop_requests.sql` (`purchase_requests`, `notifications` inbox, RLS, status guard/effects, 5-pending rate limit, one active request/product), `...09_shop_request_defaults.sql` (`buyer_id default auth.uid()`), `...10_shop_request_notify_buyer.sql` (buyer notification on submit). No payments.
- Product page has **Request to Buy**; `/shop/requests` is the buyer view (cancel pending); `/shop/my` has an **Orders / Requests** tab (accept, reject, complete + safety note); `/shop/inbox` is the notification inbox. Live RLS check (seller/buyer/other/banned): 10/10 passed.

## Campus Shop home access

- `/shop` is browsable by every signed-in user even without a `shop_profiles` row; the seller gate lives only on `/shop/new` and `/shop/my`. When no profile is found, the home feed shows a small "Sell something? Set up your shop first" link instead of replacing the marketplace. Verified live with a profile-less user: feed + `Basic Electronics Book` visible, no gate.
- The "Create shop" loop was a stale JWT: the cached identity made the UI look signed in while RLS saw an anon user, so the seller profile was invisible. `useAuth` now validates the session with `getUser()` on boot and clears stale caches; `useShopProfile` caches the last profile per user so a transient lookup failure cannot reopen the gate. My Shop edit validates title/price/quantity, and delete failures now show a toast instead of failing silently.
- Any signed-in student can become a seller: `/shop/my` and `/shop/new` render `ShopAccessGate` inline when no profile exists, so creating the shop leads straight to the dashboard/product form (no dead-end "Go to Shop"). Verified live: setup → dashboard → Add product form. `public/sw.js` cache bumped to v12.

## Campus Shop seller dashboard (Phase 2)

- Migrations `20261126000005_shop_seller_dashboard.sql` (`quantity`, `views`, stock→sold trigger, sold counter, view RPC, banned-seller update policy), `...06_shop_counter_fix.sql` (internal counter update allowed), `...07_shop_ban_check.sql` (ban check via `shop_is_banned()`).
- `/shop/my` dashboard: profile header + stats, status tabs, edit/delete/reserve/out-of-stock/relist, edit-profile dialog. Entry via **My Shop** on `/shop`. Product detail counts a view once via RPC. Live RLS check (seller/other/buyer/banned): 9/9 passed.

## Campus Shop profiles (Phase 1)

- Migration `20261126000003_shop_profiles.sql` (+ `...04_shop_contact_rule.sql`): `shop_profiles` replaces per-product contact fields (backfilled from first product). Public fields via `shop_public_profile()` RPC; phone via `shop_seller_contact()` (authenticated only). Selling requires a profile; bans still block. Google sign-in reused from `src/lib/supabase-auth.ts` — no second auth system.
- `/shop` gates signed-out users with "Continue with Google" and first-time sellers with `ShopAccessGate`; `/shop/new` also requires a profile. Live RLS check (seller/buyer/other/banned): 8/8 passed.

## Admin panel layout

- `src/components/sohoj/AdminPanel.tsx`: full-screen sheet on phones (safe-area insets), centered `sm:max-w-2xl` / `lg:max-w-3xl` dialog on larger screens. Tabs scroll horizontally on phones and become a 5-column, 2-row grid from `sm` up; lists use `min-h-0 flex-1 overflow-y-auto` for proper inner scrolling.

## Error handling

- In-app browsers can block `localStorage` entirely; `src/lib/storage.ts` (`safeGet`/`safeSet`/`safeRemove`) is the only app-level storage access, so a blocked store degrades to defaults instead of throwing during render. This was the confirmed cause of the error screen on the Class Routine tab (reproduced by forcing `Storage.prototype.getItem` to throw). `public/sw.js` cache bumped to v10.

- Shared `src/components/sohoj/ErrorState.tsx` powers the React boundary, TanStack route error and 404 pages — English-only, theme tokens, Try again / Go home / Report. `src/lib/error-page.ts` is the standalone branded server HTML (English).
- Hydration fix: localStorage-backed resources are read in `useEffect` after mount (TeacherDirectory, home index, `useAdminRole`, Student page), not in initial state — this removes React #418 mismatches online and offline.

## PWA notifications (Phase 1)

- Custom in-app sound `public/sounds/notify.mp3` (user-supplied MP3, ~4.4s, copied unchanged). `src/lib/notify-sound.ts` + `PushSoundHost` play it on `PUSH_RECEIVED` from the SW; audio unlocked on first tap/key and failures are silent. Settings route `/settings` has the sound toggle (default on) and shows last push time.
- `public/sw.js` (cache v5) broadcasts every push to open clients, uses unique tags, vibrate, `requireInteraction` for urgent, and `renotify` only when requested. Edge functions `send-class-reminders` / `sync-notices` send `Urgency: high/normal`, `TTL: 86400`, typed payload with `id`/`type`/`urgent`, delete 404/410 subscriptions and log other failures. No `topic` (distinct posts). Inbox/health screen are Phase 2.

## Admin roles (Phase 1 — backend)

- Migrations `20261126000001_admin_roles.sql` + `20261126000002_sub_admin_check_order.sql`: `institute_admins` now uses `super_admin` / `sub_admin` with `assigned_by` / `assigned_at`; legacy global admins stay super admins and at least one super admin is guaranteed. New `admin_audit_log` + triggers for admin changes, product removals, bans and CR changes.
- DB-side rules: `add_sub_admin` / `remove_sub_admin` RPCs check `is_super_admin()` on every call, enforce max 2 sub admins per institute with an advisory xact lock, one institute per user, target institute membership, and a last-super-admin guard. `my_admin_role()` / `list_admin_assignments()` expose role data to the UI. CR RLS now allows institute admins in their own institute.
- Client: `MAX_SUB_ADMINS_PER_INSTITUTE = 2` (mirrors DB), repo helpers in `src/lib/repo/admins.ts`. Live verification with 5 test users: 15/15 checks passed; all test data cleaned.
- Manage Admins UI and sub-admin scoped panel are later phases.

## Campus Shop

- Migrations `20261125000001_shop.sql` (schema/RLS/bucket), `...02_shop_image_cleanup.sql` (delete images with product), `...03_shop_rls_fixes.sql` (banned check via `shop_is_banned()` SECURITY DEFINER, `reporter_id default auth.uid()`, storage delete guard), `...04_shop_seller.sql` (`shop_seller_name()` RPC). RLS enforces institute scoping, seller-only writes, 10 active listings/user, one report/user/product, banned-user block, hides sold/removed from buyers; admin moderates via `is_institute_admin`/`is_super_admin`.
- Live RLS verification (4 test users, all cleaned up): 11/11 checks passed — anon isolation, cross-user writes, immutable fields, 11th listing, ban, duplicate report, sold/removed visibility, storage isolation/type/size, image cleanup, cross-institute admin.
- Pure helpers `src/lib/shop.ts`, repo `src/lib/repo/shop.ts` (pagination, CRUD, reports, bans, canvas image compression + bucket upload), scope helper `src/lib/shop-scope.ts`. No new dependencies.
- Phase 2 screens: `/shop` (feed/search/chips/sort/condition+price filters/pull-to-refresh/pagination), `/shop/$productId` (carousel, contact, report). No home card — Shop is reached only from the bottom bar.
- Bottom bar has a **Campus Shop** tab in the middle (route-aware active state). Any signed-in user can post via `/shop/new` (image picker + canvas compression + validation); reachable from the Sell button on `/shop` and the empty state.
- Assumption: images are in a public bucket (only contact numbers must be logged-in-only; enforced by table RLS). No in-app payments.

- CR posting fix: `my_cr_assignments()` returns snake_case columns, so `src/lib/repo/crs.ts` must map them via `fromRow` before the client uses `instituteId` (otherwise the insert violates RLS with 403 `42501`). Posts use `withNetworkRetry` (network only, once), `saveThenNotify` (push failure never rolls back the save), and specific bilingual errors via `postErrorMessage`. Toasts render above the bottom tab bar with auto-dismiss + close button.
- CR offline banner is an in-flow status element (not a toast), driven by shared `useConnectivity()` (real Supabase reachability probe + online/offline/focus/visibility re-check + one retry). A failed post shows the actual error instead of blaming the network. Message field auto-grows; semester labels use `ordinal()`.

## Class Representatives (CR)

- Migration `20261124000001_cr.sql`: `class_representatives` (super admin + own-institute admin after the role migration) + `class_updates` (CR/student/admin reads by class). RLS + SECURITY DEFINER helpers `current_verified_email`, `is_cr_of`, `is_student_of`, `my_cr_assignments`.
- Super admin assigns CRs by email in Admin Panel → CRs. Only verified emails count. Client keeps an offline cache at `class-updates-v1:*`; posting requires network.
- Student side: home "Class Updates" card, `/updates`, seen marker `class-updates-seen-v1`. CR side: `/cr`.

## Teacher accounts

- Admin Panel → Teacher Accounts creates auth users for routine teachers via `create-teacher-account` Edge Function (admin JWT + `institute_admins` check, service key only in Edge secrets). Temporary password is returned once to the admin.
- `teacher_profiles` links `user_id` → routine teacher name; `send-class-reminders` builds a per-teacher pseudo routine from all 8 routines and sends class reminders for their own classes.

## Notices

- `public.notices` (pending/approved/rejected) + `public.notice_sources`: synced by `sync-notices` Edge Function every 10 minutes (`campus-path-notice-sync` cron).
- Approved notices are pushed once (`pushed_at`) to students in that institute; `notices` RLS exposes only approved rows publicly, admins manage all.
- Admin Panel → Notices: add manually, drop a source link, approve/reject/edit/delete. Client keeps an offline copy in `sohoj-notices-v1`.

## Class push reminders

- Edge Function `send-class-reminders` runs every minute via pg_cron (`campus-path-class-reminders`) and sends Web Push to `push_subscriptions`.
- Required Edge Function secrets (names only): `CRON_SECRET` (shared auth), `CRON_DB_KEY` (valid service-role key for PostgREST), `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.
- Vault secret `campus_path_cron_key` must hold the same `CRON_SECRET` value; the cron job reads it from `vault.decrypted_secrets` so no key is stored in `cron.job`.
- Dedupe: `notification_log` unique `(user_id, kind, class_key)` prevents a repeat for the same class/day.
- Debug: call the function with `Authorization: Bearer <CRON_SECRET>` and `?dryRun=1[&now=ISO]` to preview due reminders without sending.

<!-- AGENT-SKILLS:BEGIN -->

## Skills to use going forward

These skills are installed in this codebase (`.claude/skills/`) and enabled as
project-scoped plugins in `~/.claude/plugins/installed_plugins.json`. Use them:

- **graphify** — treat any question about this codebase, its architecture, file
  relationships, or project content as a graphify query first. Turn code/docs
  into a persistent knowledge graph, then query/path/explain. Prefer it over
  ad-hoc grepping when the question is broad or cross-file.
- **ponytail** — default mode for coding tasks (write/fix/refactor/review/pick
  dependencies): smallest change that fully solves the task, YAGNI, stdlib
  first, no unrequested abstractions, and a reply a busy human reads once.
  Levels: lite / full / ultra. Also use `ponytail-review` for code review and
  `ponytail-audit` for whole-repo quality/bloat audits.
- **context-optimizer** (skills: `cco`, `token-check`, `doc-digest`,
  `fresh-start`, `sharpen-prompt`, `project-context`) — use when the user asks
  about session cost, context size, token usage, long documents, handoffs to a
  new chat, prompt sharpening, or reusable project context. Prefer digesting
  long inputs instead of pasting them whole into context.

<!-- AGENT-SKILLS:END -->
