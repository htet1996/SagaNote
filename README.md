# SagaNote

AI Voice-to-Notion SaaS platform. Record voice notes and meetings, get AI
transcription + Burmese translation + meeting minutes + action items, and save
everything to Notion. Built for Myanmar.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase ·
Google Gemini 2.5 Flash · Notion API

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Generate placeholder icon / QR images (optional but recommended)
npm run gen-icons

# 3. Fill in your secrets
#    Edit .env.local with your Supabase / Gemini / Notion keys

# 4. Run the dev server
npm run dev
# open http://localhost:3000
```

> **Full step-by-step setup is in the Burmese checklist** delivered with this
> project (Supabase, Google OAuth, Notion OAuth, Gemini, payment images, admin,
> and deployment). Start there.

---

## Project structure

```
app/                     App Router pages + API routes
  (auth)/login           Google sign-in
  (dashboard)/           Authenticated app shell + feature pages
  admin/payments         Admin payment verification
  api/                   Route handlers (transcribe, agent, tts, notion, ...)
  auth/callback          Supabase OAuth callback
components/               UI kit, recorder, shared components
hooks/                   useAudioRecorder, useCredits
lib/                     supabase, ai (gemini), notion, utils, store, constants
proxy.ts                 Next.js 16 middleware (auth gate) — must be named proxy.ts
public/                  logo + manifest + icons + payment QR
supabase/                schema.sql, storage-policies.sql, set-admin.sql
scripts/gen-icons.mjs    Generates placeholder PNG / JPG assets
types/                   Shared TypeScript types
```

---

## Environment variables

See `.env.local.example`. All keys must be filled before the app works:

| Key | Where to get it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
| `GEMINI_API_KEY` | https://aistudio.google.com → Get API key |
| `NOTION_CLIENT_ID` / `NOTION_CLIENT_SECRET` / `NOTION_REDIRECT_URI` | https://notion.so/my-integrations (Public integration) |
| `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_APP_NAME` | Your app URL + name |
| `ADMIN_EMAIL` | Your Google account email |

---

## Database

Run `supabase/schema.sql` in the Supabase SQL editor, create a **public**
storage bucket named `recordings`, then run `supabase/storage-policies.sql`.
After signing in once, run `supabase/set-admin.sql` (with your email) to grant
yourself admin access.

---

## Notes

- The in-app logo is rendered as an inline SVG (`components/shared/Logo.tsx`) so
  it is always crisp and theme-aware. `public/logo.svg` and `public/logo.png`
  are also provided — replace `logo.png` with the official artwork if you like.
- Placeholder payment QR images live in `public/payment-qr/` — replace
  `kbzpay.jpg`, `wavepay.jpg`, `ayapay.jpg`, `cbpay.jpg` with your real QR
  screenshots.
- Credits are stored in **seconds** (1 minute = 60 credits). New users get
  1,800 credits (30 minutes) free.
