import { format } from 'date-fns'
const EventCard = ({ summary, description, location, start }) => {
  const tags = description
    .replace('\n', '')
    .split('#')
    .filter((t) => t !== '#')
  const confirmed = !tags.includes('maybe')
  return (
    <div className={`relative pb-4 pt-3 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-24 after:h-0.5 ${confirmed ? 'after:bg-text' : 'after:bg-text-bg'}`}>
      <p className={`${confirmed ? '' : 'text-text-bg'} !text-contrast !text-[10px] font-semibold mt-2`}>{format(new Date(start.dateTime), 'dd/MM/yyyy')}</p>
      <h3 className="!leading-none !pb-0">{summary}</h3>
      <p className={`text-text text-sm ${confirmed ? '' : ''}`}>{location}</p>
    </div>
  )
}


export default EventCard