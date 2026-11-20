# Routine OCR + Cloud admin setup

The app currently runs fully offline: routines, rooms, and admin accounts live in `localStorage`.
The frontend is already wired for Lovable Cloud — follow these steps in the Lovable editor to
turn on real image/PDF OCR and cross-device admin accounts.

## 1. Enable Lovable Cloud

In the Lovable editor, enable **Cloud** for this project. Ask Lovable to create:

- `routines` table: `id`, `institute_id`, `semester`, `shift`, `department`, `title`,
  `class_start`, `class_load`, `periods` (jsonb), `entries` (jsonb), `source`, `verified`,
  `file`, `created_at`, `updated_at`
- `admins` table: `email` (unique), `institute_id` (`all` for super admin), `role`,
  `added_by`, `added_at`

Seed `shovaslks@gmail.com` as `role = super`, `institute_id = all`.

> Per `AGENTS.md`, schema changes should be made in Lovable, not by hand-editing migrations.

## 2. Add the OCR edge function

Create a Lovable Cloud edge function named `ocr-routine` that:

1. Accepts `POST` multipart form data with field `file` (image or PDF).
2. Sends the file to the **Lovable AI gateway** (keep `LOVABLE_API_KEY` server-side only)
   with a prompt that returns JSON:
   ```json
   {
     "classStart": "27-09-2026",
     "classLoad": 34,
     "entries": [
       {
         "day": "Sunday",
         "period": 1,
         "endPeriod": 1,
         "code": "28533",
         "acronym": "MSU",
         "subject": "Application Development Using Python",
         "teacher": "MD. SORIAT ULLAH",
         "room": "2302"
       }
     ]
   }
   ```
3. Returns that JSON to the client.

## 3. Point the app at the function

Add the function URL to a `.env` file:

```
VITE_ROUTINE_OCR_URL=https://<project>.functions.supabase.co/ocr-routine
```

`src/lib/routine.ts` reads this variable. When present, the **Image / PDF upload** button in
Admin Panel → Routines calls the function and fills the routine grid automatically. When absent,
the app keeps working offline: paste the routine text and press **Auto parse & make routine**.

## 4. Move the auth/store layer to Cloud (optional)

`src/lib/admin.ts` and `src/lib/routine.ts` expose small, pure functions (`loadAdmins`,
`upsertRoutine`, `roomsFromRoutine`, …). Swap the `localStorage` calls in `src/routes/index.tsx`
for Lovable Cloud queries/mutations using the same shapes; no UI changes are needed.

## Behaviour that already works offline

- Two seeded Rajshahi CST routines (1st + 3rd semester, Morning shift) in the **Class Routine** tab.
- Admin Panel → Routines: upload reference file, paste text, auto-parse, edit every class, save.
- Saving a routine auto-creates its rooms (`Room 2302`, floor 2, etc.).
- Selecting a room shows every class happening there during the week.
- Super admin (`shovaslks@gmail.com`) manages admins; max 5 per institute; institute admins are
  restricted to their own polytechnic.
