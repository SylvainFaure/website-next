const getSpotifyCurrentTrack = async () => {
  let returnValue
  try {
    const request = await fetch(process.env.NEXT_PUBLIC_LAMBDA_SPOTIFY_URL)
    const response = await request.json()
    if (response.body.artists) {
      returnValue = response.body
    }
  } catch (error) {
    console.warn(error)
    returnValue = {
      error: true,
      fullError: error
    }
  }

  return returnValue
}

export {
  getSpotifyCurrentTrack
}