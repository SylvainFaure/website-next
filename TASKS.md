# Tasks

Goal: deploy the new Next.js version of the website on Vercel.

Legend: `[x]` done · `[ ]` to do · `(me)` handled by Sylvain

---

## Done

- [x] Next.js 15 (App Router) + Tailwind 4 setup, pages: home, about, lists, `/projects/mydiscogs`
- [x] Supabase project (single env for local + prod) with migrations for `concerts` and `books` (RLS: public read only, writes server-side)
- [x] `book-covers` Storage bucket (public, images only, 4 MB max)
- [x] Public lists: `/lists/concerts` (+ `/past`) and `/lists/books` with search, language/publisher filters, year nav, cover zoom, indie bookshop links
- [x] Books: language and ISBN columns
- [x] Admin at `/admin`: password login with HMAC session cookie (middleware), CRUD for concerts and books, cover upload
- [x] Redirects from the old `/calendar` and `/calendar/past` URLs
- [x] Unit tests (`node:test`) for validation, ISBN, filters, shop links, session

---

## To do

### 1. Move off AWS (Lambda + DynamoDB) to Vercel/Supabase

Still calling AWS today:
- `src/service/index.js`: Spotify (`NEXT_PUBLIC_LAMBDA_SPOTIFY_URL`) and Google Calendar (`NEXT_PUBLIC_LAMBDA_GCALENDAR_EVENTS`) Lambdas
- `src/service/discogs/constants.js`: API Gateway `LAMBDA_BASE_URL` storing the Discogs wantlist and collection in DynamoDB

- [ ] Inventory the Lambdas and DynamoDB tables (what each does, which secrets and data they hold)
- [ ] Export the DynamoDB data still worth keeping and import it into Supabase
- [ ] Rewrite each Lambda as a Next.js route handler / server action (or a Vercel cron)
- [ ] Remove the `NEXT_PUBLIC_LAMBDA_*` env vars and `LAMBDA_BASE_URL`
- [ ] Shut down the AWS resources once production runs on Vercel

### 2. Concerts: drop the Google Calendar dependency

Before: upcoming concerts were read in the browser from a public Lambda that returned my **whole private Google Calendar** to every visitor (filtered client-side). Now Supabase is the source of truth and the calendar is fed from it.

- [ ] **Urgent, on AWS:** disable the Google Calendar Lambda / its API Gateway route (it leaks every calendar event; the current live site may still call it)
- [x] Upcoming concerts come from the `concerts` table (until their last day), rendered server-side; past page only shows past ones
- [x] "Maybe" checkbox (replaces the `#maybe` tag): dimmed on the site, "(maybe)" in the calendar — migration `20261117010000_concerts_upcoming.sql`
- [x] Saving an upcoming concert pushes it to a dedicated "Concerts" Google Calendar (service account, all-day event, edits update it, deletes remove it); admin shows which ones are in the calendar + "add missing" button
- [x] Fixed: past concerts were hidden when there was no upcoming event
- [x] Removed the Calendar Lambda call from the code
- [x] Google setup (service account + "Concerts" calendar) and end-to-end test (create → event, edit → updated, delete → removed)
- [ ] Remove `NEXT_PUBLIC_LAMBDA_GCALENDAR_EVENTS` from `.env`
- No extra fields (time, tickets) for now; nothing to import from the old calendar

### 3. Discogs: same feature, less complexity

Before: every visit fetched all Discogs pages and PUT them to an AWS Lambda + DynamoDB (whose wantlist sync was broken). Covers came from a Spotify search Lambda (first result, unchecked).

- [x] `discogs_releases` table (one row per release, flagged wantlist/collection) + public `record-covers` bucket — migration `20261117000000_discogs.sql`
- [x] Public page `/lists/my-discogs` reads from Supabase only (redirects from `/projects/mydiscogs` and `/projects/my-discogs-wantlist`)
- [x] Admin `/admin/discogs`: "Sync from Discogs" (upsert, delete releases gone from both lists) with counts and last sync date
- [x] Admin "Fetch covers": Spotify search (app credentials, artist + title must match) else Discogs image, copied to Storage so every cover works in the 3D scene; runs in batches
- [x] "Listen on Spotify" link in the record popup
- [x] 3D page fixes: mobile list rendered nothing, scene created twice and never stopped (render loop, listeners), modal lookup by id, debug logs
- [x] Old Lambda/DynamoDB code and `lodash.uniqby` removed; DynamoDB data not imported (fresh sync instead)
- [x] Migration applied, first sync + covers done (277 releases: 253 Spotify covers, 24 Discogs, 32 MB)
- [ ] Check the 3D page on a real phone (mobile layout not verified in the browser)
- [ ] Delete `discogs-lambda.js` and `spotify-discogs-lambda.js` from the repo root (kept only for the analysis)
- [ ] On AWS: delete the two Discogs Lambdas, their DynamoDB tables and the `/items` + `/collection` API Gateway routes
- [ ] Later: a way to retry releases without a cover (Spotify adds albums over time), or set one by hand

### 4. Music: Spotify + other services + listening history

Before: the footer called an AWS Lambda holding a refresh token in env vars; that token was revoked, so the player was already empty. Since 2026 Spotify refresh tokens expire 6 months after the authorization (refreshing doesn't extend them) and the app owner needs Premium.

- [x] "Now playing" from `/api/now-playing` (cached 30 s), current track else last played; the Lambda call is gone
- [x] Admin `/admin/music`: "Connect Spotify" (OAuth, refresh token stored in the private `music_accounts` table, not in env vars), shows when the access ends, "Sync now"
- [x] History in Supabase: `music_plays` (every play) and `music_library` (saved tracks/albums, removed ones kept with `removed_at`), `source` column for other services later — migration `20261117020000_music.sql`
- [x] `/api/cron/music` (protected by `CRON_SECRET`): last 50 plays + new saves every run, full library pass once a day
- [x] Public page `/music`: recent plays by day (consecutive tracks of an album grouped under one cover), recently saved albums/tracks, "Music" menu entry, footer player links to it
- [x] Top artists/albums from Spotify's own ranking (`user-top-read`, 4 weeks / 6 months / 12 months tabs), daily snapshot in `music_top` (migration `20261117030000_music_top.sql`); albums derived from the top 50 tracks
- [x] Spotify connected locally (redirect URI `http://127.0.0.1:3000/admin/spotify/callback`), first sync done: 7,880 saved tracks, 1,376 albums, plays from Nov 16
- [ ] After deploy: allow `https://<domain>/admin/spotify/callback` in the Spotify app
- [ ] Later: our own "most played this week" with play counts, once there is enough history
- [ ] After deploy: hourly Supabase cron job (`pg_cron` + `pg_net`) calling `/api/cron/music` with the secret stored in Supabase Vault (Vercel Hobby crons only run daily)
- [ ] Reconnect Spotify every 6 months (the admin warns 2 weeks before)
- [ ] Remove the unused `SPOTIFY_REFRESH_TOKEN`, `SPOTIFY_TOKEN`, `SPOTIFY_TOKEN_URL`, `SPOTIFY_QUERY_URL`, `NEXT_PUBLIC_LAMBDA_SPOTIFY_URL`, `LAMBDA_SPOTIFY_DISCOGS`, `TABLE_NAME`, `COLLECTION_TABLE_NAME` env vars; delete the Spotify Lambda on AWS
- [ ] Later: browse older history (pagination / by month)
- Deezer: not now. Its developer portal doesn't accept new applications (Nov 2026), so it can't be connected unless that reopens
- Bandcamp: dropped. No official fan API (only unofficial collection/wishlist endpoints) and no listening history

### 5. Lists hub

- [x] Discogs moved to `/lists/my-discogs` (with redirects)
- [x] Discogs, Concerts and Books all live under `/lists`
- [x] One "Lists" entry in the menu instead of separate Concerts / Books entries (menu: Home, About, Lists, Music)
- [x] `/lists` home page: one card per list with counts, next concert (or the last ones) and latest book / record covers; revalidated by admin edits
- [x] "← Lists" link on the Discogs 3D page (it has no site menu); home page link points to `/lists/my-discogs`

### 6. About page

- [ ] (me) Rewrite the about section to be more straightforward
- [x] Fix the Discogs wantlist link (now `/lists/my-discogs`)

### 7. Deploy on Vercel

- [ ] Push the repo to a git remote (none configured yet) and link it to a Vercel project
- [ ] Set env vars on Vercel (Supabase keys, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `DISCOGS_TOKEN`, `SPOTIFY_CLIENT`, `CRON_SECRET`, `GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_CALENDAR_ID`)
- [ ] Check `npm run build`, `npm run lint`, `npm test` pass
- [ ] Point the domain to Vercel and check the old URLs still resolve (redirects)
- [ ] Replace the default create-next-app `README.md`
