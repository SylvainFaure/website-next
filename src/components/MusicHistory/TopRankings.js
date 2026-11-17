'use client'
/* eslint-disable @next/next/no-img-element -- Spotify serves covers already sized */

import { useState } from 'react'

const Ranking = ({ title, items }) => (
  <section className="min-w-0">
    <h3 className="text-base font-semibold !pb-2">{title}</h3>
    {items.length ? (
      <ol className="flex flex-col gap-2">
        {items.map(({ key, name, secondary, image, url }, index) => (
          <li key={key} className="flex items-center gap-3 min-w-0">
            <span className="w-5 text-right text-xs opacity-60 tabular-nums">{index + 1}</span>
            {image ? (
              <img src={image} alt="" loading="lazy" className="w-10 h-10 shrink-0 rounded-sm object-cover" />
            ) : (
              <div className="w-10 h-10 shrink-0 rounded-sm bg-text-bg" />
            )}
            <div className="min-w-0 flex-1">
              <a href={url} target="_blank" rel="noopener noreferrer" className="block truncate font-semibold hover:underline">
                {name}
              </a>
              {secondary && <p className="m-0 truncate text-sm text-text">{secondary}</p>}
            </div>
          </li>
        ))}
      </ol>
    ) : (
      <p className="text-sm opacity-80">Nothing yet.</p>
    )}
  </section>
)

// ranges: [{ key, label }]; tops: { [key]: { artists, albums } } (see topLists)
const TopRankings = ({ ranges, tops }) => {
  const [range, setRange] = useState(ranges[0].key)
  const { artists, albums } = tops[range]

  return (
    <section>
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 pb-4">
        <h2 className="text-lg font-semibold !pb-0">Top of the last</h2>
        <div role="tablist" aria-label="Period" className="flex gap-2">
          {ranges.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={range === key}
              onClick={() => setRange(key)}
              className={`rounded-full border px-3 py-0.5 text-sm transition-colors ${
                range === key
                  ? 'border-lime-100 bg-lime-100 text-gray-600 font-semibold'
                  : 'border-[rgba(240,240,201,0.35)] hover:border-lime-100'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        <Ranking title="Artists" items={artists.map((a) => ({ ...a, secondary: null }))} />
        <Ranking title="Albums" items={albums} />
      </div>
      <p className="text-xs opacity-60 pt-3">Ranked by Spotify from everything I listened to.</p>
    </section>
  )
}

export default TopRankings
