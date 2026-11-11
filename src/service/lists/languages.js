// Languages a book can be read in.
// To add one: add it here and to the books_lang_check constraint (see supabase/migrations).
export const BOOK_LANGUAGES = {
  it: 'Italian',
  fr: 'French'
}

export const isBookLanguage = (code) => typeof code === 'string' && Object.hasOwn(BOOK_LANGUAGES, code)
