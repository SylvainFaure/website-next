'use client'

import { useEffect, useState } from 'react'
import EventCard from '@/components/EventCard'
import PastConcerts from '@/components/PastConcerts'
import { getCalendarEvents } from '@/service'

const UpcomingConcerts = ({ pastConcerts }) => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCalendarEvents = async () => {
      try {
        const response = await getCalendarEvents()
        if (!response.error) {
          setEvents(response)
        } else {
          console.warn(response.fullError)
        }
      } catch (error) {
        console.warn(error)
      } finally {
        setTimeout(() => {
          setLoading(false)
        }, 200)
      }
    }
    fetchCalendarEvents()
  }, [])

  return (
    <div className="default-page calendar">
      <div className="events__wrapper">
        <div className="events__wrapper--header">
          <h1 className="calendar__title">See you there?</h1>
          <h3>This is the list of events I&apos;ll try to attend in the next months</h3>
          <p>For the darker ones I am currently not sure of going, but why not?</p>
        </div>
        <img
          className="mt-6 mb-8 rounded-md"
          src="/unwound.jpeg"
          alt="This is a photo of Unwound, a band that unfortunately I have never seen"
        />
        {loading ? (
          <p>Loading...</p>
        ) : events && !!events.length ? (
          <div>
            {events.map((event, i) => {
              return <EventCard key={`event-${i}`} {...event} />
            })}
            <PastConcerts concertsByYear={pastConcerts} />
          </div>
        ) : (
          <p>No events found</p>
        )}
      </div>
    </div>
  )
}

export default UpcomingConcerts
