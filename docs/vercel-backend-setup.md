# Vercel Backend Setup

## 1 — Create a Vercel Postgres database

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard) → **Storage** → **Create Database** → choose **Postgres**.
2. Name it `aw-portal-db` (or anything), accept defaults.
3. Once created, open the database → **Settings** → copy the **`POSTGRES_URL`** connection string.
4. Keep DB URLs private. Do not share `POSTGRES_URL` or `DATABASE_URL` in public docs.

## 2 — Run the schema

Option A — Vercel dashboard:
- In the database page, click **Query** tab and paste the contents of `schema.sql`, then run.

Option B — psql locally:
```bash
psql "postgres://..." -f schema.sql
```
(Replace `...` with your `POSTGRES_URL`.)

## 3 — Link the database to your project

In the Vercel dashboard:
- Open your project → **Settings** → **Environment Variables**.
- Click **Connect Store** (or add manually) and link the `aw-portal-db` database.
- Vercel will inject `POSTGRES_URL`, `POSTGRES_HOST`, etc. automatically into your serverless functions.

## 4 — Local development

Install the Vercel CLI once:
```bash
npm i -g vercel
vercel login
vercel link   # link this folder to your Vercel project
```

Pull env vars locally:
```bash
vercel env pull .env.local
```

Run everything together (frontend + API functions on port 3000):
```bash
npm run dev:api   # runs `vercel dev`
```

## 5 — Switch the app to the API-backed store

When you're ready to use the database instead of localStorage, open `src/App.tsx` and change:

```ts
// Before
import { ..., usePortalStore } from "./store/usePortalStore";

// After
import { ..., usePortalStore } from "./store/useApiStore";
```

Then call `init()` once on app mount — add this near the top of the `App` component:

```ts
useEffect(() => {
  usePortalStore.getState().init();
}, []);
```

The store will fetch all clients and reports from the API on load. While loading, `apiStatus.loading` is `true`; any API errors appear in `apiStatus.error`.

## 6 — Deploy

```bash
vercel --prod
```

The `/api` directory is picked up automatically by Vercel as serverless functions.

## URL Separation Rule

- **App URL (public):** your Vercel deployment link (safe to share with reviewers).
- **DB URL (private):** `POSTGRES_URL` / `DATABASE_URL` (never share publicly).
