// imageSource: "cover" = our Storage copy (drawn by the 3D scene), "external" = Discogs URL (plain image only)
const DiscogsItem = ({ item }) => {
  const isCover = item.imageSource === 'cover'
  return (
    <article className="item" data-id={item.id}>
      <img
        className="item__img js-image"
        src={item.image ?? '/discogs-vinyl.svg'}
        data-src={isCover ? 'cover' : 'discogs'}
        // Same CORS mode as the WebGL texture loader, so the browser can reuse the cached image
        crossOrigin={isCover ? 'anonymous' : undefined}
        alt={`${item.artist} – ${item.title}`}
      />
      <div className="item__infos">
        <p className="item__infos-artist">{item.artist}</p>
        <p className="item__infos-title">{item.title}</p>
        <p className="item__infos-format">{[item.format, item.year].filter(Boolean).join(' - ')}</p>
      </div>
    </article>
  )
}

export default DiscogsItem
