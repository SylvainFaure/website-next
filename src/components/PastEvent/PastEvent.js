import { highlight } from '@/utils/search'

const PastEvent = ({ date, artists, event, venue, city, query }) => {
  return (
    <div>
      <p className="!text-contrast text-[10px] font-semibold mt-2">{highlight(date, query)}</p>
      <h3 className="!leading-none !pb-0">
        {(artists ?? []).map((artist, idx) => (
          <span key={`artist-${idx}`}>
            {idx > 0 ? ', ' : ''}
            {highlight(artist, query)}
          </span>
        ))}
      </h3>
      {event && <p>{highlight(event, query)}</p>}
      <p className="text-text text-sm">
        {highlight(venue, query)} <span className="text-text">@ {highlight(city, query)}</span>
      </p>
    </div>
  )
}

export default PastEvent
