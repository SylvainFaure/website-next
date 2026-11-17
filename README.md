# sylvainfaure.dev

My personal website: a few words about me, the lists I keep (concerts, books, records) and what I'm listening to.

Next.js 15 (App Router) · React 19 · Tailwind 4 · Supabase (Postgres + Storage) · deployed on Vercel.

## Pages

- `/` and `/about`
- `/lists`: hub for the lists below
  - `/lists/concerts` (upcoming + past) and `/lists/concerts/past`
  - `/lists/books`: books read, with links to independent bookshops
  - `/lists/my-discogs`: Discogs collection and wantlist in a 3D scene
- `/music`: Spotify top artists/albums, recently saved albums and tracks, listening history
- `/admin`: password-protected back office (concerts, books, Discogs sync, Spotify connection)

## How the data flows

- **Supabase is the source of truth.** Public pages read it with the publishable key (RLS: read-only) and are rebuilt at most hourly (ISR). Admin server actions write with the secret key and revalidate the affected pages.
- **Concerts** saved in the admin are pushed to a Google Calendar through a service account (upcoming ones only).
- **Discogs**: "Sync from Discogs" and "Fetch covers" in the admin copy the collection and wantlist, and their covers, into Supabase.
- **Spotify**: connected once from `/admin/music` (OAuth; the refresh token lives in a private table and expires after 6 months). `/api/cron/music` collects plays, saved items and Spotify's top lists; it is called every hour by a Supabase cron job. `/api/now-playing` feeds the footer player.

## Development

```bash
npm install
npm run dev     # http://localhost:3000 (use http://127.0.0.1:3000 to connect Spotify)
npm test        # node:test unit tests in tests/
npm run lint
npm run build
```

Environment variables (`.env` / `.env.local`, never committed):

| Variable | Used for |
|---|---|
| `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` | Database and storage |
| `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` | Admin login and session cookie |
| `DISCOGS_TOKEN` | Discogs sync |
| `SPOTIFY_CLIENT` | Spotify app, base64 of `client_id:client_secret` |
| `CRON_SECRET` | Bearer token expected by `/api/cron/music` |
| `GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_CALENDAR_ID` | Concerts calendar (base64 of the service account key) |

Database changes are SQL migrations in `supabase/migrations/`, applied in order.

`TASKS.md` tracks what is done and what is left.
