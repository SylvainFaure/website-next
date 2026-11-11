import { useCallback, useEffect, useState } from 'react'

export const sectionId = (key) => `year-${key}`

// Tracks which year section is on screen and scrolls to a section on demand.
// `keys` are strings (e.g. '2024', 'earlier') and must be memoized by the caller.
// Each section heading needs id={sectionId(key)}.
const useYearNav = (keys) => {
  const [activeKey, setActiveKey] = useState(keys[0])

  useEffect(() => {
    if (!keys.length) return
    setActiveKey((prev) => (keys.includes(prev) ? prev : keys[0]))
  }, [keys])

  useEffect(() => {
    const keyById = new Map(keys.map((key) => [sectionId(key), key]))
    const headings = keys.map((key) => document.getElementById(sectionId(key))).filter(Boolean)
    if (!headings.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (a.boundingClientRect.top ?? 0) - (b.boundingClientRect.top ?? 0))[0]
        const key = visible && keyById.get(visible.target.id)
        if (key !== undefined) setActiveKey(key)
      },
      { root: null, rootMargin: '-25% 0px -70% 0px', threshold: [0, 1] }
    )

    headings.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [keys])

  const scrollTo = useCallback((key) => {
    const el = document.getElementById(sectionId(key))
    if (!el) return
    setActiveKey(key)
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return { activeKey, scrollTo }
}

export default useYearNav
