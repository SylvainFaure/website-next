import { 
  WANTS,
  COLLECTION,
  BRAINZ,
  COVER,
  LAMBDA_BASE_URL
} from './constants'
const { mapDiscsToItems } = require('./utils')
const BASE_URL = 'https://api.discogs.com'
const HEADERS = {
  'Authorization': `Discogs token=${process.env.DISCOGS_TOKEN}`
}

const DISCOGS_API = {
  getWants: async () => {
    const req = await fetch(`${BASE_URL}/${WANTS}`, {
      headers: HEADERS
    })
    const discogsResults = await req.json()
    let _wants = mapDiscsToItems(discogsResults).wants


    const getNextPageWants = async (page) => {
      return new Promise(async (resolve) => {
        const request = await fetch(`${BASE_URL}/${WANTS}?page=${page}&per_page=50`, {
          headers: HEADERS
        })
        const results = await request.json()
        resolve(results)
      })
    }
    if (discogsResults.pagination.pages > 1) {
      for (let i = 1; i < discogsResults.pagination.pages; i++) {
        const newReq = await getNextPageWants(i + 1)
        _wants = [..._wants, ...mapDiscsToItems(newReq).wants]
      }
    }

    await fetch(`${LAMBDA_BASE_URL}/items`, {
      method: 'PUT',
      body: JSON.stringify({
        data: _wants
      })
    })
    const dbRequest = await fetch(`${LAMBDA_BASE_URL}/items`)
    const dbResults = await dbRequest.json()
    return dbResults
  },

  getCollection: async () => {
    const req = await fetch(`${BASE_URL}/${COLLECTION}`, {
      headers: HEADERS
    })
    const discogsCollection = await req.json()
    let _collection = mapDiscsToItems(discogsCollection, 'releases').releases

    const getNextPageCollection = async (page) => {
      return new Promise(async (resolve) => {
        const request = await fetch(`${BASE_URL}/${COLLECTION}?page=${page}&per_page=50`, {
          headers: HEADERS
        })
        const results = await request.json()
        resolve(results)
      })
    }
    if (discogsCollection.pagination.pages > 1) {
      for (let i = 1; i < discogsCollection.pagination.pages; i++) {
        const newReq = await getNextPageCollection(i + 1)
        _collection = [..._collection, ...mapDiscsToItems(newReq, 'releases').releases]
      }
    }
    await fetch(`${LAMBDA_BASE_URL}/collection`, {
      method: 'PUT',
      body: JSON.stringify({
        data: _collection
      }) 
    })

    const dbRequest = await fetch(`${LAMBDA_BASE_URL}/collection`)
    const dbResults = await dbRequest.json()
    return dbResults
    //return { releases: dbResults, pagination: discogsCollection.pagination }
  },

  getNextWants: async (url) => {
    const results = await fetch(url, {
      headers: HEADERS
    })
    return mapDiscsToItems(results)
  },

  getImages: async ({ basic_information }) => {
    const { artists, title } = basic_information
    const artist = artists[0].name.toLowerCase()
    const _title = title.toLowerCase()

    try {
      const releases = await fetch(`${BRAINZ}?query=${encodeURIComponent(artist)}%20${encodeURIComponent(_title)}`)
      if (releases) {
        const release = releases.releases.find((release) => {
          const rTitle = release.title.toLowerCase().replaceAll(' ', '')
          const rArtist = release['artist-credit'][0].name.toLowerCase().replaceAll(' ', '')
          return rTitle === _title.replaceAll(' ', '') && rArtist === artist.replaceAll(' ', '')
        })
        const mbid = release ? release.id : 'placeholder'
        return `${COVER}/${mbid}/front`
      }
    } catch (error) {
      console.log('getImages error', error)
      return 'https://placebeard.it/350x300'
    }
  }
}

export default DISCOGS_API