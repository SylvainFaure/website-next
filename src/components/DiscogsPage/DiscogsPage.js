'use client'
import { useEffect, useRef, useState } from 'react'
import imagesLoaded from 'imagesloaded'
import DiscogsItem from './Item'

const MOBILE_WIDTH = 780
const NO_ITEMS = []

const CATEGORIES = {
  wantlist: {
    label: 'Wantlist',
    description: "Les disques que je n'ai pas encore mais que j'aimerais bien !"
  },
  collection: {
    label: 'Collection',
    description: "Les disques que j'ai et que je mets de temps en temps sur la platine"
  }
}

// Cold CDN cache + ~300 parallel requests can make a few covers fail: retry those once.
const retryBrokenImages = (images) =>
  Promise.all(
    images
      .filter((img) => !img.naturalWidth)
      .map(
        (img) =>
          new Promise((resolve) => {
            img.onload = img.onerror = () => resolve()
            img.src = `${img.src.split('?')[0]}?retry=1`
          })
      )
  )

const Row = ({ items, name }) => (
  <div className={`items__row ${name}`}>
    {items.map((item) => (
      <div key={item.id} className="item__wrapper">
        <DiscogsItem item={item} />
      </div>
    ))}
  </div>
)

const MyDiscogs = ({ lists }) => {
  const [category, setCategory] = useState('wantlist')
  // null until measured in the browser
  const [isMobile, setIsMobile] = useState(null)
  const [loading, setLoading] = useState(true)
  // Once the fade-in is over, drop the delayed CSS transition so the scene's animations aren't delayed
  const [settled, setSettled] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)

  const modalRef = useRef(null)
  const containerRef = useRef(null)
  const itemsRef = useRef(null)

  const items = lists[category] ?? NO_ITEMS

  useEffect(() => {
    setIsMobile(document.body.clientWidth < MOBILE_WIDTH)
  }, [])

  // One 3D scene per list: built once the covers are loaded, destroyed when switching list or leaving the page.
  useEffect(() => {
    if (isMobile === null) return
    let scene = null
    let cancelled = false
    const timers = []

    setLoading(true)
    setSettled(false)
    window.scrollTo(0, 0)

    // Only covers stored in Supabase can be WebGL textures (the other hosts don't send CORS headers)
    const images = [...itemsRef.current.querySelectorAll('.js-image[data-src="cover"]')]
    imagesLoaded(images, async () => {
      await retryBrokenImages(images)
      const { default: Scene } = await import('@/three/index.js')
      if (cancelled) return
      scene = new Scene({
        modal: modalRef.current,
        container: containerRef.current,
        // A cover that still failed would be sized wrong in 3D: leave it out
        images: images.filter((img) => img.naturalWidth),
        isMobile,
        callback: () => {
          timers.push(
            setTimeout(() => {
              setLoading(false)
              timers.push(setTimeout(() => setSettled(true), 1500))
            }, 1000)
          )
        },
        eventHandlers: {
          animationOn: (evt) => {
            const id = evt.target.closest('.item')?.dataset.id
            setSelectedItem(items.find((item) => item.id === id) ?? null)
          },
          animationOff: () => setSelectedItem(null)
        }
      })
    })

    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
      scene?.destroy()
    }
  }, [category, isMobile, items])

  const visibility = loading ? 'visibility-hidden' : settled ? '' : 'visible'
  const { label, description } = CATEGORIES[category]

  return (
    <div className="page discogs">
      <header className={visibility}>
        <h1 className="page-title">
          <a className="discogs-logo" href="https://www.discogs.com">
            <img src="/discogs-vinyl.svg" alt="" />
          </a>
          My Discogs
          <span className="categories">
            {Object.entries(CATEGORIES).map(([key, value], i) => (
              <span key={key} className="contents">
                {i > 0 && '-'}
                <span
                  role="button"
                  tabIndex={0}
                  className={category !== key ? 'notselected' : ''}
                  onClick={() => setCategory(key)}
                  onKeyDown={(e) => e.key === 'Enter' && setCategory(key)}>
                  {value.label}
                </span>
              </span>
            ))}
          </span>
        </h1>
        <div className="page-description">{description}</div>
        <div className="page-total-discs">
          Ma {label} comporte {items.length} disques.
        </div>
      </header>

      <div>
        <section key={category} ref={itemsRef} className={`items__wrapper ${visibility}`} asscroll-container="">
          {isMobile ? (
            <div className="items">
              {items.map((item) => (
                <div key={item.id} className="item__wrapper">
                  <DiscogsItem item={item} />
                </div>
              ))}
            </div>
          ) : (
            <div className="items">
              <Row name="first" items={items.filter((_, i) => i % 2 === 0)} />
              <Row name="second" items={items.filter((_, i) => i % 2 !== 0)} />
            </div>
          )}
        </section>
      </div>

      <section className={loading ? 'page-loading' : 'page-loading hidden'}>
        Loading...
        <a className="discogs-logo" href="https://www.discogs.com">
          <img src="/discogs-vinyl.svg" alt="" />
        </a>
      </section>

      <div ref={containerRef} id="container" className={visibility}></div>

      <div ref={modalRef} id="modal">
        <div className="modal-content">
          <div className="modal-content__infos">
            <h2>{selectedItem?.artist}</h2>
            <h3>{selectedItem?.title}</h3>
            <p>{selectedItem?.year || null}</p>
          </div>
          <div className="modal-content__image"></div>
          <div className="modal-content__cta">
            {selectedItem?.spotifyUrl && (
              <>
                <a
                  className="modal-content__cta-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={selectedItem.spotifyUrl}>
                  Listen on Spotify
                </a>
                <span className="px-3">·</span>
              </>
            )}
            <a
              className="modal-content__cta-link"
              target="_blank"
              rel="noopener noreferrer"
              href={selectedItem?.discogsUrl}>
              See on Discogs -&gt;
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MyDiscogs
