'use client'
import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
const LINKS = [
  {
    label: 'Linkedin',
    url: 'https://www.linkedin.com/in/sylvain-faure',
    target: '_blank',
    content: `
            <div>
              Here I present my skills and my last works. 
              I'm currently working as a frontend developer for <a class="home__link" href="https://www.smartway.work">Smartway</a>
            </div>
          `
  },
  {
    label: 'Github',
    url: 'https://github.com/SylvainFaure',
    target: '_blank',
    content: `
            <div>
              You can check all my repos and all my contributions. 
              Nothing special here but if you find some bugs in my code just <a class="home__link" href="mailto:sylvain.faure@live.fr">let me know!</a>
            </div>
          `
  },
  {
    label: 'Discogs wantlist',
    url: '/projects/my-discogs-wantlist',
    content: `
            <div>
              In case you want to make me a gift you can get some inspirations there!
            </div>
          `
  },
  {
    label: 'events calendar',
    url: '/lists/concerts',
    content: `
            <div>
              Maybe we could go to a concert together? What do you say?
            </div>
          `
  },
  {
    label: 'travelblog',
    url: 'http://www.cartedevoyages.com',
    target: '_blank',
    content: `
            <div>
              It's an oooooold project and it's not complete yet &#128517!! 
              I will talk more about it in a blog post but just know that although it is far from perfect I learned a lot building this site
            </div>
          `
  },
  {
    label: 'Mixcloud',
    url: 'https://mixcloud.com/UpsetTheRythm/',
    target: '_blank',
    content: `
            <div>
              Long time ago I was involved in making some radio shows. 
              This one is about math-rock and experimental musics (I love music).
              I'm not sure you will get a lot of pleasure if you don't understand french, but you can give it a try!
            </div>
          `
  },
  {
    label: 'first website',
    url: 'http://www.skiagraphie.fr/',
    target: '_blank',
    content: `
            <div>
              A friend that I met doing radio shows told me that he had long been considering creating a personal portfolio for his photos. With my freshly developed skills, I spent a consiferable amount of time building this site, my
              <span class="italic">first complete website</span>. When I look at the code now, I don't know whether I should laugh or cry, but as everyone knows, first love never dies, so I can look beyond its blemishes!
            </div>
          `
  }
]

const HomeLinks = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showMoreInfos, setShowMoreInfos] = useState(false)
  const [infosHovered, setInfosHovered] = useState(false)

  const animation = useRef(null)

  useEffect(() => {
    animation.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % LINKS.length)
    }, 3000)

    return () => clearInterval(animation?.current)
  }, [])

  const handleAnimationMouseover = () => {
    clearInterval(animation?.current)
    setShowMoreInfos(true)
  }

  const handleAnimationMouseleave = () => {
    if (infosHovered) return
    animation.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % LINKS.length)
    }, 3000)
    setShowMoreInfos(false)
  }

  const handleInfosMouseover = () => {
    setInfosHovered(true)
  }

  const handleInfosMouseleave = () => {
    setInfosHovered(false)
  }

  return (
    <div className="flex flex-col items-center">
      <div
        style={{ gridTemplateColumns: 'auto 1fr' }}
        className="grid items-center justify-center min-h-8 overflow-hidden text-2xl">
        <p className="mr-2">Here is my</p>
        <div className="flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={LINKS[currentIndex].label}
              initial={{ opacity: 0, transform: 'translateY(-10px)', visibility: 'hidden', zIndex: -1 }}
              animate={{ opacity: 1, transform: 'translateY(0)', visibility: 'visible', zIndex: 1 }}
              exit={{ opacity: 0, transform: 'translateY(10px)' }}
              transition={{ duration: 0.5 }}>
              <div onMouseEnter={handleAnimationMouseover} onMouseLeave={handleAnimationMouseleave}>
                <a className="font-semibold !text-gray-800" href={LINKS[currentIndex].url} target={LINKS[currentIndex].target}>
                  {LINKS[currentIndex].label}
                </a>
              </div>
            </motion.div>

          </AnimatePresence>
        </div>
      </div>
      <div className="min-h-32">
        {showMoreInfos ? (
          <div
            className="pt-2 flex justify-center"
            onMouseEnter={handleInfosMouseover}
            onMouseLeave={handleInfosMouseleave}>
            <div
              className="flex justify-center px-8 border-x border-y-0 border-lime-100"
              dangerouslySetInnerHTML={{ __html: LINKS[currentIndex].content }}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default HomeLinks
