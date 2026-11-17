-- Music: Spotify connection (private), listening history and saved library (public read).
-- Replaces the AWS "now playing" Lambda. Collected hourly by /api/cron/music.

-- One row per connected service. Holds the refresh token: no public access at all.
create table if not exists public.music_accounts (
  source text primary key check (source in ('spotify')),
  refresh_token text not null,
  account_name text,
  scopes text,
  -- Spotify refresh tokens expire 6 months after this date (refreshing doesn't extend them)
  authorized_at timestamptz not null default now(),
  last_sync_at timestamptz,
  last_full_sync_at timestamptz,
  -- null when the last sync worked
  last_error text,
  updated_at timestamptz not null default now()
);

alter table public.music_accounts enable row level security;
revoke all on public.music_accounts from anon, authenticated;
grant all on public.music_accounts to service_role;

-- Every track played (Spotify only exposes the last 50, hence the hourly collection).
create table if not exists public.music_plays (
  id bigint generated always as identity primary key,
  source text not null default 'spotify',
  played_at timestamptz not null,
  track_id text not null,
  track_name text not null,
  artists text[] not null default '{}',
  album_id text,
  album_name text,
  image_url text,
  duration_ms integer,
  url text,
  created_at timestamptz not null default now(),
  constraint music_plays_unique unique (source, played_at)
);

create index if not exists music_plays_played_at_idx on public.music_plays (played_at desc);

-- Saved tracks and albums. Removed items are kept with removed_at (history, not a mirror).
create table if not exists public.music_library (
  source text not null default 'spotify',
  kind text not null check (kind in ('track', 'album')),
  item_id text not null,
  name text not null,
  artists text[] not null default '{}',
  -- for tracks: the album they belong to
  album_name text,
  image_url text,
  url text,
  added_at timestamptz not null,
  removed_at timestamptz,
  synced_at timestamptz not null default now(),
  primary key (source, kind, item_id)
);

create index if not exists music_library_added_at_idx on public.music_library (kind, added_at desc);

alter table public.music_plays enable row level security;
alter table public.music_library enable row level security;

drop policy if exists "Public read music plays" on public.music_plays;
create policy "Public read music plays" on public.music_plays for select to anon, authenticated using (true);
drop policy if exists "Public read music library" on public.music_library;
create policy "Public read music library" on public.music_library for select to anon, authenticated using (true);

revoke all on public.music_plays, public.music_library from anon, authenticated;
grant select on public.music_plays, public.music_library to anon, authenticated;
grant all on public.music_plays, public.music_library to service_role;
