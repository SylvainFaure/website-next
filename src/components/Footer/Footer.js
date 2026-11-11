'use client'
import { useState, useEffect } from "react"
import Icon from "@/components/Icon"
import Player from "@/components/Player"
import { getSpotifyCurrentTrack } from "@/service"

const LINKS = [
    {
      label: "linkedin",
      href: "https://www.linkedin.com/in/sylvain-faure",
    },
    {
      label: "github",
      href: "https://github.com/SylvainFaure",
    },
    {
      label: "bluesky",
      href: "https://bsky.app/profile/sylvainfaure.dev",
    }
  ]
const Footer = () => {
  const [playerInfos, setPlayerInfos] = useState(null)

  useEffect(() => {
    const fetchPlayerInfos = async () => {
      const track = await getSpotifyCurrentTrack()
      setPlayerInfos(track)
    }
    fetchPlayerInfos()
  }, [])

  return (
    <footer className="border-t border-lime-100">
      <div className="flex justify-center flex-wrap py-4 md:flex-row-reverse md:justify-between">
        <ul className="flex gap-4">
          {LINKS.map((item) => (
            <li className="w-6 h-6" key={item.href}>
              <a className="inline-block w-6 h-6 text-lime-100" href={item.href}>
                <Icon name={item.label} size="custom" className="w-6 h-6"/>
                <p className="sr-only">{item.label}</p>
              </a>
            </li>
          ))}
        </ul>
        { playerInfos ? (
          <Player {...playerInfos} />
        ) : null }
      </div>
    </footer>
  )
}

export default Footer