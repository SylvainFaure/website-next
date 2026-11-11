'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import DiscogsItem from './Item'
import imagesLoaded from 'imagesloaded'
const MyDiscogs = ({ page }) => {
  const [loading, setLoading] = useState(true)
  const [scene, setScene] = useState(null)
  const [isMobile, setIsMobile] = useState(false)
  const [selectedItem, setSelectedItem] = useState({})
  const [mouseEntered, setMouseEntered] = useState(false)
  const [category, setCategory] = useState('wants')
  const [items, setItems] = useState(page[category])
  const [firstRow, setFirstRow] = useState(items?.filter((item, i) => i % 2 === 0))
  const [secondRow, setSecondRow] = useState(items?.filter((item, i) => i % 2 !== 0))

  const modalRef = useRef(null)
  const containerRef = useRef(null)

  const handleAnimationOn = useCallback(
    (evt) => {
      const id = evt.target.closest('.item').dataset.id
      setSelectedItem(page[category].find((node) => node.id === id))
    },
    [category, page]
  )

  const instanciateScene = useCallback(() => {
    imagesLoaded('.js-image', async () => {
      const Scene = await import('@/three/index.js')
      setScene(
        new Scene.default({
          modal: modalRef.current,
          container: containerRef.current,
          images: [...document.querySelectorAll('.js-image[data-src=spotify]')],
          callback: sceneInstanciated,
          isMobile: isMobile,
          eventHandlers: {
            animationOn: handleAnimationOn,
            animationOff: handleAnimationOff
          }
        })
      )
    })
  }, [handleAnimationOn, isMobile])

  const sceneInstanciated = () => {
    console.log('Callback')
    setTimeout(() => {
      setLoading(false)
      setTimeout(() => {
        const visible = document.querySelectorAll('.visible')
        Array.from(visible).forEach((item) => {
          item.classList.remove('visible')
        })
      }, 1500)
    }, 1000)
  }

  const handleAnimationOff = () => {
    setSelectedItem({})
  }
  const handleImageHover = (on) => {
    setMouseEntered(on)
  }

  const destroyScene = () => {
    scene.destroy()
  }

  const changeCategory = (_category) => {
    setLoading(true)
    window.scrollTo(0, 0)
    if (_category !== category) {
      const _items = page[_category]
      setCategory(_category)
      setItems(_items)
      setFirstRow(_items.filter((item, i) => i % 2 === 0))
      setSecondRow(_items.filter((item, i) => i % 2 !== 0))
      reloadScene()
      setTimeout(() => {
        setLoading(false)
      })
    }
  }
  const reloadScene = () => {
    setTimeout(() => {
      destroyScene()
      instanciateScene()
    })
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        if (document.body.clientWidth < 780) {
          setIsMobile(true)
          setLoading(false)
        }
        instanciateScene()
      })
    }
  }, [instanciateScene])

  return (
    <div className="page discogs" key={category}>
      <header className={loading ? 'visibility-hidden' : 'visible'}>
        <h1 className="page-title">
          <a className="discogs-logo" href="https://www.discogs.com">
            <img src="/discogs-vinyl.svg" alt="" />
          </a>
          My Discogs
          <span className="categories">
            <span
              className={category !== 'wants' ? 'notselected' : ''}
              onClick={() => changeCategory('wants')}>
              Wantlist
            </span>
            -
            <span
              className={category !== 'releases' ? 'notselected' : ''}
              onClick={() => changeCategory('releases')}>
              Collection
            </span>
          </span>
        </h1>
        <div className="page-description">
          {category === 'wants'
            ? "Les disques que je n'ai pas encore mais que j'aimerais bien !"
            : "Les disques que j'ai et que je met de temps en temps sur la platine"}
        </div>
        <div className="page-total-discs">
          Ma {category === 'wants' ? 'Wantlist' : 'Collection'} comporte
          {page && page[category] && page[category].length} disques.
        </div>
      </header>

      <div>
        <section
          className={loading ? 'items__wrapper visibility-hidden' : 'items__wrapper visible'}
          asscroll-container="">
          {!isMobile ? (
            <div className="items">
              <div className="items__row first">
                {firstRow && !!firstRow.length
                  ? firstRow.map((item) => {
                      return (
                        <div key={`first-row-${item.id}`} className="item__wrapper">
                          <DiscogsItem item={item} />
                        </div>
                      )
                    })
                  : null}
              </div>
              <div className="items__row second">
                {secondRow && !!secondRow.length
                  ? secondRow.map((item) => {
                      return (
                        <div key={`second-row-${item.id}`} className="item__wrapper">
                          <DiscogsItem item={item} />
                        </div>
                      )
                    })
                  : null}
              </div>
            </div>
          ) : (
            <div className="items">
              {items &&
                !!items.length &&
                items.map((item) => {
                  ;<div key={item.id} className="item__wrapper">
                    <DiscogsItem {...item} />
                  </div>
                })}
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
      <div
        ref={containerRef}
        id="container"
        className={loading ? 'visibility-hidden' : 'visible'}></div>
      <div ref={modalRef} id="modal">
        <div className="modal-content">
          <div className="modal-content__infos">
            <h2>{selectedItem.artist}</h2>
            <h3>{selectedItem.album}</h3>
            <p>{selectedItem.year}</p>
          </div>
          <div className="modal-content__image"></div>
          <div className="modal-content__cta">
            <a className="modal-content__cta-link" target="_blank" href={selectedItem.discogs_link}>
              See on Discogs -&gt;
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MyDiscogs
