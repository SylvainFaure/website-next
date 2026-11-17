// An upcoming concert. "Maybe" ones (not sure to go yet) are dimmed.
const EventCard = ({ dateLabel, date, artists, event, venue, city, maybe }) => {
  const year = date.slice(0, 4)
  return (
    <div
      className={`relative pb-4 pt-3 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-24 after:h-0.5 ${
        maybe ? 'after:bg-text-bg' : 'after:bg-text'
      }`}>
      <p className={`${maybe ? 'opacity-50' : ''} !text-contrast !text-[10px] font-semibold mt-2`}>
        {dateLabel}/{year}
        {maybe && ' · maybe'}
      </p>
      <h3 className={`!leading-none !pb-0 ${maybe ? 'text-text-bg' : ''}`}>{artists.join(', ')}</h3>
      <p className="text-text text-sm">{[event, venue, city].filter(Boolean).join(', ')}</p>
    </div>
  )
}

export default EventCard
