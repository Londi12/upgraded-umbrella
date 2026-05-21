# CVKonnekt

CV builder, job search, and application tracker for South African job seekers. Free, no subscriptions.

## Features

- CV builder with multiple templates
- Cover letter builder
- AI job matching (Google Gemini)
- ATS scoring
- Job search (powered by JSearch / RapidAPI)
- Application tracker
- CV parsing (PDF, DOCX, TXT)
- Admin panel for job management

## Stack

- Next.js 16 (App Router)
- Supabase (auth + database)
- Tailwind CSS + shadcn/ui
- Google Gemini API
- JSearch API (RapidAPI)
- Vercel (hosting)
- GitHub Actions (daily job scrape trigger)

## Setup

### 1. Clone and install

```bash
git clone <repo>
cd cvkonnekt
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required:
- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — required for secure server-side inserts/updates
- `NEXT_PUBLIC_SITE_URL` — your deployed URL (for auth redirects)
- `JSEARCH_API_KEY` — RapidAPI key for JSearch (job scraping)
- `RAPIDAPI_KEY` — optional shared RapidAPI key for all providers
- `RAPIDAPI_INDEED_KEY` — optional Indeed-specific key (overrides shared key)
- `ACTIVE_JOBS_DB_RAPIDAPI_KEY` — optional ActiveJobsDB key (overrides shared key)
- `CRON_SECRET` — random secret to protect the scrape cron endpoint
- `GOOGLE_GENERATIVE_AI_API_KEY` — Gemini API key for AI features

### 3. Database

Run `scripts/migration.sql` once in your Supabase SQL Editor. This creates all tables, RLS policies, and indexes.

### 4. Admin access

To make a user an admin, insert their Supabase user ID into the `admin_users` table:

```sql
INSERT INTO admin_users (user_id) VALUES ('your-user-uuid');
```

### 5. Run locally

```bash
npm run dev
```

## Job Scraping

Jobs are fetched once per day via GitHub Actions by calling the protected endpoint `GET /api/cron/scrape-jobs`.
The scrape aggregates multiple providers, deduplicates by URL, then upserts into `scraped_jobs`:
- JSearch runs daily
- ActiveJobsDB and Indeed run on quota-safe days each month (1st, 8th, 15th, 22nd UTC) to stay within common free-tier limits

You can also trigger a manual scrape from the admin panel or by calling `POST /api/scrape-jobs`.

The cron endpoint requires `Authorization: Bearer <CRON_SECRET>`.

### GitHub Actions setup

Create the following repository secrets in GitHub:
- `SCRAPE_URL` — full endpoint URL, for example `https://your-app.vercel.app/api/cron/scrape-jobs`
- `CRON_SECRET` — must match your app's `CRON_SECRET` environment variable

Workflow file: `.github/workflows/daily-job-scrape.yml` (runs daily at 03:00 UTC and supports manual run).

## Deployment

Deploy to Vercel. Set all env vars in the Vercel dashboard. Daily scraping is triggered from GitHub Actions.

## Support

CVKonnekt is free for all South African job seekers.
