-- Lists CMS: past concerts and books read.
-- Apply with `supabase db push`, or paste into the Supabase SQL editor.

create table if not exists public.concerts (
  id bigint generated always as identity primary key,
  date date not null,
  end_date date,
  artists text[] not null check (cardinality(artists) > 0),
  event text,
  venue text not null,
  city text not null,
  created_at timestamptz not null default now(),
  constraint concerts_end_after_start check (end_date is null or end_date >= date)
);

create index if not exists concerts_date_idx on public.concerts (date desc);

create table if not exists public.books (
  id bigint generated always as identity primary key,
  title text not null,
  author text not null,
  edition text,
  -- null = read before the yearly lists (shown in the "earlier" section)
  year smallint check (year between 1900 and 2100),
  -- path inside the "book-covers" storage bucket
  cover_path text,
  created_at timestamptz not null default now()
);

create index if not exists books_year_idx on public.books (year desc nulls last, id);

-- Everyone can read; nobody can write through the public API.
-- The site writes server-side with the secret key, which bypasses RLS.
alter table public.concerts enable row level security;
alter table public.books enable row level security;

drop policy if exists "Public read concerts" on public.concerts;
create policy "Public read concerts" on public.concerts for select to anon, authenticated using (true);

drop policy if exists "Public read books" on public.books;
create policy "Public read books" on public.books for select to anon, authenticated using (true);

-- Supabase's default privileges grant everything to anon/authenticated; keep read only
-- (RLS already blocks writes, but TRUNCATE is not covered by RLS).
revoke all on public.concerts, public.books from anon, authenticated;
grant select on public.concerts, public.books to anon, authenticated;
grant all on public.concerts, public.books to service_role;

-- Public bucket for book covers (4 MB max, images only).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('book-covers', 'book-covers', true, 4194304, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
