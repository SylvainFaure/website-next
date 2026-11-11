-- ISBN-13 of the edition read (optional): used for the bookshop links and covers.
alter table public.books add column if not exists isbn text;

alter table public.books drop constraint if exists books_isbn_check;
alter table public.books add constraint books_isbn_check check (isbn ~ '^97[89][0-9]{10}$');
