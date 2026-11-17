import Image from 'next/image'
import EventCard from '@/components/EventCard'
import PastConcerts from '@/components/PastConcerts'

// upcoming: concerts soonest first; pastConcerts: [{ year, concerts }] (see getConcertLists)
const UpcomingConcerts = ({ upcoming = [], pastConcerts = [] }) => (
  <div className="default-page calendar">
    <div className="events__wrapper">
      <div className="events__wrapper--header">
        <h1 className="calendar__title">See you there?</h1>
        <h3>This is the list of events I&apos;ll try to attend in the next months</h3>
        <p>For the darker ones I am currently not sure of going, but why not?</p>
      </div>
      <Image
        className="mt-6 mb-8 rounded-md"
        src="/unwound.jpeg"
        alt="This is a photo of Unwound, a band that unfortunately I have never seen"
        width={719}
        height={354}
        priority
      />
      {upcoming.length ? (
        upcoming.map((concert) => <EventCard key={concert.id} {...concert} />)
      ) : (
        <p>No upcoming concerts for now.</p>
      )}
      <PastConcerts concertsByYear={pastConcerts} />
    </div>
  </div>
)

export default UpcomingConcerts
