import MyDiscogs from "@/components/DiscogsPage"
import API from "@/service/discogs/wantlist"

const MyDiscogsPage = async () => {
  const { getWants, getCollection } = API
  const [wants, releases] = await Promise.all([getWants(), getCollection()])
  console.log(wants, releases)
  const page = { wants, releases }
  console.log('PAGE', page)
  return (
    <MyDiscogs page={page} />
  )
}

export default MyDiscogsPage