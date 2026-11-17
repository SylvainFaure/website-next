/* eslint-disable @next/next/no-img-element -- Spotify serves covers already sized (64/300 px) */
import TopRankings from './TopRankings'
import { TOP_RANGES } from '@/service/music/tracks'

const TIME_ZONE = 'Europe/Rome'
const sinceLabel = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: TIME_ZONE })
const dayLabel = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
const timeLabel = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: TIME_ZONE })

const Cover = ({ src, size = 'w-10 h-10' }) =>
  src ? (
    <img src={src} alt="" loading="lazy" className={`${size} shrink-0 rounded-sm object-cover`} />
  ) : (
    <div className={`${size} shrink-0 rounded-sm bg-text-bg`} />
  )

const ExternalLink = ({ href, children, className = '' }) =>
  href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`hover:underline ${className}`}>
      {children}
    </a>
  ) : (
    <span className={className}>{children}</span>
  )

const Time = ({ play }) => (
  <time dateTime={play.playedAt} className="text-xs opacity-60 tabular-nums">
    {timeLabel.format(new Date(play.playedAt))}
  </time>
)

const SinglePlay = ({ play }) => (
  <li className="flex items-center gap-3 min-w-0">
    <Cover src={play.image} />
    <div className="min-w-0 flex-1">
      <ExternalLink href={play.url} className="block truncate font-semibold">
        {play.name}
      </ExternalLink>
      <p className="m-0 truncate text-sm text-text">
        {play.artists.join(', ')}
        {play.album ? ` · ${play.album}` : ''}
      </p>
    </div>
    <Time play={play} />
  </li>
)

// Several tracks of the same album in a row: the album once, then its tracks in listening order.
const AlbumRun = ({ run }) => {
  const first = run.plays[0]
  const last = run.plays.at(-1)
  return (
    <li className="flex gap-3 min-w-0 py-1">
      <Cover src={run.image} size="w-16 h-16 sm:w-20 sm:h-20" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-3 min-w-0">
          <p className="m-0 min-w-0 flex-1 truncate font-semibold">{run.album}</p>
          <span className="text-xs opacity-60 tabular-nums whitespace-nowrap">
            {timeLabel.format(new Date(first.playedAt))} – {timeLabel.format(new Date(last.playedAt))}
          </span>
        </div>
        <p className="m-0 truncate text-sm text-text">
          {run.artists.join(', ')} · {run.plays.length} tracks
        </p>
        <ol className="mt-2 border-l border-[rgba(240,240,201,0.25)] pl-3 flex flex-col gap-0.5">
          {run.plays.map((play) => (
            <li key={play.id} className="flex items-baseline gap-3 min-w-0 text-sm">
              <ExternalLink href={play.url} className="min-w-0 flex-1 truncate">
                {play.name}
              </ExternalLink>
              <Time play={play} />
            </li>
          ))}
        </ol>
      </div>
    </li>
  )
}

// Data from getMusicPage()
const MusicHistory = ({ days, tops, historySince, savedAlbums, savedTracks }) => (
  <div className="pt-12 pb-16 flex flex-col gap-12">
    <header>
      <h1 className="text-2xl font-semibold !pb-0">What I&apos;m listening to</h1>
      <p className="text-text text-sm">
        From Spotify, updated every hour
        {historySince ? `, plays kept since ${sinceLabel.format(new Date(historySince))}` : ''}.
      </p>
    </header>

    <TopRankings ranges={TOP_RANGES} tops={tops} />

    {savedAlbums.length > 0 && (
      <section>
        <h2 className="text-lg font-semibold !pb-2">Recently saved albums</h2>
        <ul className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {savedAlbums.map((album) => (
            <li key={album.id} className="min-w-0">
              <ExternalLink href={album.url} className="block">
                <Cover src={album.image} size="w-full aspect-square" />
                <p className="m-0 mt-1 truncate text-sm font-semibold">{album.name}</p>
                <p className="m-0 truncate text-xs text-text">{album.artists.join(', ')}</p>
              </ExternalLink>
            </li>
          ))}
        </ul>
      </section>
    )}

    <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
      <section className="min-w-0">
        <h2 className="text-lg font-semibold !pb-2">Recently played</h2>
        {days.length ? (
          days.map(({ day, runs }) => (
            <div key={day} className="mb-6">
              <h3 className="text-sm uppercase tracking-wide opacity-70 !pb-2">
                {dayLabel.format(new Date(`${day}T12:00:00Z`))}
              </h3>
              <ul className="flex flex-col gap-3">
                {runs.map((run) =>
                  run.plays.length > 1 ? (
                    <AlbumRun key={run.plays[0].id} run={run} />
                  ) : (
                    <SinglePlay key={run.plays[0].id} play={run.plays[0]} />
                  )
                )}
              </ul>
            </div>
          ))
        ) : (
          <p className="text-sm opacity-80">Nothing played yet.</p>
        )}
      </section>

      {savedTracks.length > 0 && (
        <section className="min-w-0">
          <h2 className="text-lg font-semibold !pb-2">Recently saved tracks</h2>
          <ul className="flex flex-col gap-2">
            {savedTracks.map((track) => (
              <li key={track.id} className="flex items-center gap-3 min-w-0">
                <Cover src={track.image} />
                <div className="min-w-0 flex-1">
                  <ExternalLink href={track.url} className="block truncate font-semibold">
                    {track.name}
                  </ExternalLink>
                  <p className="m-0 truncate text-sm text-text">{track.artists.join(', ')}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  </div>
)

export default MusicHistory
