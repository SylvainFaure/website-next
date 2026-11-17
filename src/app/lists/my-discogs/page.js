import MyDiscogs from '@/components/DiscogsPage'
import { getDiscogsLists } from '@/service/discogs/releases'

// Rebuilt at most hourly; syncing from the admin revalidates it immediately.
export const revalidate = 3600

export const metadata = {
  title: 'My Discogs · Sylvain Faure',
  description: 'My vinyl wantlist and collection'
}

export default async function MyDiscogsPage() {
  const lists = await getDiscogsLists()
  return <MyDiscogs lists={lists} />
}
