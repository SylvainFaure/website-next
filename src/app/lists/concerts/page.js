import DefaultLayout from '@/components/Layouts/DefaultLayout'
import UpcomingConcerts from '@/components/UpcomingConcerts'
import { getPastConcertsByYear } from '@/service/lists/concerts'

// Rebuilt at most hourly; admin edits revalidate it immediately.
export const revalidate = 3600

export default async function ConcertsPage() {
  const pastConcerts = await getPastConcertsByYear()
  return (
    <DefaultLayout>
      <UpcomingConcerts pastConcerts={pastConcerts} />
    </DefaultLayout>
  )
}
