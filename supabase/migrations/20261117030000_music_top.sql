-- Spotify's own top artists and tracks (computed by Spotify from the whole listening history),
-- one snapshot per day and period. Top albums are derived from the top tracks.

create table if not exists public.music_top (
  source text not null default 'spotify',
  kind text not null check (kind in ('artist', 'track')),
  -- Spotify periods: ~4 weeks, ~6 months, ~1 year
  time_range text not null check (time_range in ('short_term', 'medium_term', 'long_term')),
  taken_on date not null,
  rank smallint not null,
  item_id text not null,
  name text not null,
  -- for tracks: their artists and album
  artists text[] not null default '{}',
  album_id text,
  album_name text,
  album_url text,
  image_url text,
  url text,
  primary key (source, kind, time_range, taken_on, rank)
);

create index if not exists music_top_taken_on_idx on public.music_top (taken_on desc);

alter table public.music_top enable row level security;

drop policy if exists "Public read music top" on public.music_top;
create policy "Public read music top" on public.music_top for select to anon, authenticated using (true);

revoke all on public.music_top from anon, authenticated;
grant select on public.music_top to anon, authenticated;
grant all on public.music_top to service_role;
