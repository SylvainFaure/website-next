-- Language the book was read in.
-- To add a language, update this constraint and BOOK_LANGUAGES in src/service/lists/languages.js.
alter table public.books add column if not exists lang text not null;

alter table public.books drop constraint if exists books_lang_check;
alter table public.books add constraint books_lang_check check (lang in ('it', 'fr'));
