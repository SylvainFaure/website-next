import DefaultLayout from '@/components/Layouts/DefaultLayout'
import UpcomingConcerts from '@/components/UpcomingConcerts'
import { getConcertLists } from '@/service/lists/concerts'

// Rebuilt at most hourly (also moves concerts from upcoming to past); admin edits revalidate it immediately.
export const revalidate = 3600

export default async function ConcertsPage() {
  const { upcoming, pastByYear } = await getConcertLists()
  return (
    <DefaultLayout>
      <UpcomingConcerts upcoming={upcoming} pastConcerts={pastByYear} />
    </DefaultLayout>
  )
}
