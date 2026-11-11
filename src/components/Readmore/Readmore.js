import { useLayoutEffect, useRef, useState } from 'react'

const Readmore = ({ children }) => {
  const [isOpened, setIsOpened] = useState(false)
  const contentRef = useRef(null)
  const [contentHeight, setContentHeight] = useState(0)

  useLayoutEffect(() => {
    if (!contentRef.current) return
    setContentHeight(contentRef.current.scrollHeight || 0)
  }, [children, isOpened])

  const handleClick = () => {
    setIsOpened(!isOpened)
  }
  return (
    <div
      className={`readmore ${isOpened ? 'opened' : ''}`}
      onClick={handleClick}
      style={
        contentHeight
          ? { '--readmore-content-max-height': `${contentHeight}px` }
          : undefined
      }
    >
      <div className="readmore__content" ref={contentRef}>
        {children}
      </div>
      <button
        type="button"
        className="readmore__toggle"
        aria-label={isOpened ? 'Collapse content' : 'Expand content'}
      >
        <span className="readmore__arrow" aria-hidden="true">
          ↓
        </span>
      </button>
    </div>
  )
}

export default Readmore