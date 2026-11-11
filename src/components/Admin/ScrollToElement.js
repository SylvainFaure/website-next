'use client'

import { useEffect } from 'react'

// Scrolls an element into view once the page is shown (e.g. the book just edited).
// Deferred one frame so it runs after the router's own scroll-to-top on navigation.
const ScrollToElement = ({ id }) => {
  useEffect(() => {
    const frame = requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'center' }))
    return () => cancelAnimationFrame(frame)
  }, [id])
  return null
}

export default ScrollToElement
