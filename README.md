# ExamMitra PWA

A free Study Ratna-permission based study resource web app with:

- Next.js frontend/backend
- Supabase database/auth
- Admin panel
- Public page importer for Study Ratna pages
- Draft → publish workflow
- Credits page, contact/removal page, minimal ad spaces

## Setup

1. Create a free Supabase project.
2. Open Supabase SQL Editor and run `supabase/schema.sql`.
3. In Supabase Authentication, create your admin user email/password.
4. Copy `.env.example` to `.env.local` and fill keys:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `IMPORT_SECRET`
5. Install and run:

```bash
npm install
npm run dev
```

6. Open `/admin`, login, enter your `IMPORT_SECRET`, run importer.
7. Review imported drafts and publish.

## Important

- The importer only fetches public pages. Do not bypass login, payment, encryption, or security.
- Study Ratna credit is on `/credits` as agreed.
- If third-party copyright owners complain, remove the item quickly.
- The current scraper is generic. For exact batch/resource pages, add those public URLs in Admin and improve selectors in `lib/importer.ts` if needed.

## Deployment free

- Push to GitHub.
- Import repo in Vercel.
- Add the same env variables in Vercel.
- Deploy.

## Auto daily import

Use Vercel Cron or GitHub Actions to call:

`POST https://yourapp.vercel.app/api/import/studyratna`

Header:

`Authorization: Bearer YOUR_IMPORT_SECRET`
