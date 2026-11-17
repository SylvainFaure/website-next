-- Upcoming concerts live in the same table (future dates); Google Calendar is fed from it.

-- Gigs I'm not sure to attend yet (shown dimmed, "(maybe)" in the calendar)
alter table public.concerts add column if not exists maybe boolean not null default false;

-- Last successful push to Google Calendar; null = not in the calendar (never pushed, or the push failed).
-- The calendar event id is derived from the concert id (see src/service/lists/calendarEvent.js).
alter table public.concerts add column if not exists calendar_synced_at timestamptz;
