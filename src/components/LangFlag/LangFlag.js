import { BOOK_LANGUAGES } from '@/service/lists/languages'

// Inline SVG rather than emoji flags, which Windows renders as plain letters.
// Both current flags are vertical tricolours; another language may need its own drawing here.
const TRICOLOURS = {
  it: ['#009246', '#ffffff', '#ce2b37'],
  fr: ['#0055a4', '#ffffff', '#ef4135']
}

const LangFlag = ({ lang, className = '' }) => {
  const colours = TRICOLOURS[lang]
  if (!colours) return null
  const label = `Read in ${BOOK_LANGUAGES[lang] ?? lang}`

  return (
    <svg
      viewBox="0 0 3 2"
      width="15"
      height="10"
      role="img"
      aria-label={label}
      className={`inline-block shrink-0 rounded-[2px] ring-1 ring-black/20 ${className}`}
    >
      <title>{label}</title>
      {colours.map((fill, i) => (
        <rect key={fill} x={i} y="0" width="1" height="2" fill={fill} />
      ))}
    </svg>
  )
}

export default LangFlag
