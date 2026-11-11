import DefaultLayout from '@/components/Layouts/DefaultLayout'
import PastConcerts from '@/components/PastConcerts'
import { getPastConcertsByYear } from '@/service/lists/concerts'

// Rebuilt at most hourly; admin edits revalidate it immediately.
export const revalidate = 3600

export default async function PastConcertsPage() {
  const concertsByYear = await getPastConcertsByYear()
  return (
    <DefaultLayout>
      <PastConcerts
        concertsByYear={concertsByYear}
        image={{
          src: '/unwound.jpeg',
          alt: 'This is a photo of Unwound, a band that unfortunately I have never seen'
        }}
      />
    </DefaultLayout>
  )
}
