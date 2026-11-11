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

const getCalendarEvents = async () => {
  let response
  try {
    const request = await fetch(process.env.NEXT_PUBLIC_LAMBDA_GCALENDAR_EVENTS)
    response = await request.json()
    return response.filter(({ description }) => !!description)
  } catch (error) {
    console.warn(error)
    return {
      error: true,
      fullError: error
    }
  }
}


export {
  getSpotifyCurrentTrack,
  getCalendarEvents
}