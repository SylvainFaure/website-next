-- Discogs wantlist + collection, synced from Discogs from the admin (replaces the AWS Lambda + DynamoDB).
-- One row per release; a release can be in the wantlist, the collection, or both.

create table if not exists public.discogs_releases (
  release_id bigint primary key,
  artist text not null,
  -- cleaned artist names, used to match the release on Spotify
  artists text[] not null default '{}',
  title text not null,
  year smallint,
  format text,
  discogs_image_url text,
  in_wantlist boolean not null default false,
  in_collection boolean not null default false,
  wantlist_added_at timestamptz,
  collection_added_at timestamptz,
  spotify_id text,
  -- path inside the "record-covers" storage bucket
  cover_path text,
  cover_source text check (cover_source in ('spotify', 'discogs')),
  -- null = "Fetch covers" hasn't looked for this release yet
  cover_checked_at timestamptz,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint discogs_releases_listed check (in_wantlist or in_collection)
);

-- Everyone can read; writes happen server-side with the secret key (bypasses RLS).
alter table public.discogs_releases enable row level security;

drop policy if exists "Public read discogs releases" on public.discogs_releases;
create policy "Public read discogs releases" on public.discogs_releases for select to anon, authenticated using (true);

revoke all on public.discogs_releases from anon, authenticated;
grant select on public.discogs_releases to anon, authenticated;
grant all on public.discogs_releases to service_role;

-- Public bucket for record covers, copied from Spotify or Discogs (2 MB max, images only).
-- Supabase Storage sends CORS headers, so the 3D scene can use them as WebGL textures.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('record-covers', 'record-covers', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
