const DiscogsItem = ({ item }) => {

  const emitCustomEvent = (eventName, detail) => {
    const event = new CustomEvent(eventName, { detail })
    document.dispatchEvent(event)
  }
  const handleMouseOver = () => {
    emitCustomEvent('image-hover', true)
  }
  const handleMouseOut = () => {
    emitCustomEvent('image-hover')
  }
  const handleClick = (e) => {
    emitCustomEvent('click', e)
  }

  return (
    <article
      className="item"
      data-id={item.id}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      onClick={handleClick}>
      <img
        className="item__img js-image"
        src={item.spotify_image ? item.spotify_image : item.discogs_image}
        data-src={item.spotify_image ? 'spotify' : 'discogs'}
        alt={item.title}
      />
      <div className="item__infos">
        <p className="item__infos-artist">{item.artist}</p>
        <p className="item__infos-title">{item.album}</p>
        <p className="item__infos-format">
          {item.format} - {item.year}
        </p>
      </div>
    </article>
  )
}

export default DiscogsItem
