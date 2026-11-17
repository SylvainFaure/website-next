import DefaultLayout from '@/components/Layouts/DefaultLayout'
import MusicHistory from '@/components/MusicHistory'
import { getMusicPage } from '@/service/music/history'

// Rebuilt at most hourly; the hourly collection and the admin sync revalidate it.
export const revalidate = 3600

export const metadata = {
  title: 'Music · Sylvain Faure',
  description: 'What I have been listening to lately'
}

export default async function MusicPage() {
  const data = await getMusicPage()
  return (
    <DefaultLayout>
      <MusicHistory {...data} />
    </DefaultLayout>
  )
}
