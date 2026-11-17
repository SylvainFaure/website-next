'use client'
import Link from 'next/link'
import DefaultLayout from '@/components/Layouts/DefaultLayout'
import Readmore from '@/components/Readmore'
const About = () => {


  return (
    <DefaultLayout>
      <div className="custom">
        <div>
          <h1 className="mt-8">I&apos;m a French web-developer currently based in Italy</h1>
          <img
            className="mt-4 mb-8 rounded-md"
            src="/cv.jpg"
            alt="That's me in the Sahara with my Big'n t-shirt"
          />
          <div className="content">
            <h2>tl;dr</h2>
            <h3>Technologies I work with</h3>
            <ul className="list-disc list-inside mb-4">
              <li>HTML / CSS / Javascript</li>
              <li>React / NextJS</li>
              <li>Vue / Nuxt</li>
              <li>SCSS / styled-components</li>
            </ul>
            <h3>Companies I work(ed) for</h3>
            <ul className="list-disc list-inside mb-4">
              <li>
                <a className="animated" href="https://www.smartwaywork.com" target="_blank">
                  Smartway
                </a>
              </li>
              <li>
                <a className="animated" href="https://www.caffeina.com" target="_blank">
                  Caffeina
                </a>
              </li>
              <li>
                <a className="animated" href="https://www.develondigital.com" target="_blank">
                  Develon Digital
                </a>
              </li>
              <li>
                <a className="animated" href="https://triplesense.it/" target="_blank">
                  Triplesense Reply
                </a>
              </li>
              <li>
                And also
                <a className="animated" href="https://www.reverse.hr" target="_blank">
                  Reverse
                </a>
                ,
                <a className="animated" href="https://www.zextras.com" target="_blank">
                  Zextras
                </a>
              </li>
            </ul>
            <h3>Stuffs I like</h3>
            <ul className="list-disc list-inside mb-4">
              <li>
                Music <span>&#127928;</span>
              </li>
              <li>
                Culture, letterature, cinema <span>&#127916;</span>
              </li>
              <li>
                Nature, riding a bike and walk in the mountains
                <span>&#127956;</span>
              </li>
              <li>
                Ecological ideas, sostenability <span>&#127793;</span>
              </li>
            </ul>
            <br />
            <div className="pt-4 md:pt-8">
              <h2>Professional path</h2>
              <Readmore>
                <p>
                  Although nowadays I write code most of the time, I did not study anything related to
                  computer science! In fact, I studied literature and art at high school and
                  university in France, and I worked for a few years in the cultural sector. It&apos;s
                  not always obvious, but I never regret that choice and I find that it gives me more
                  strength when facing my day to day challenges. When I moved to Turin, Italy, a year
                  of-taking on small jobs forced me to change my approach and consider working in
                  another sector. While waiting for invariably negative answers from job offers, I
                  started studying the foundations of 
                  <span className="language">HTML</span> and
                  <span className="language">CSS</span>. At first, it felt like a game, something of a
                  pastime. After a few weeks, I realized that I had stumbled across something that I
                  <span className="italic">really</span> liked and that it really could be my future
                  job. Coding was like reliving the joy of building cool things with Lego. Except
                  maybe that with Lego you don&apos;t have to struggle with Webpack config
                  <span>&#128516;</span>I began studying coding every day at home. I found a job in
                  the IT sector, but it wasn&apos;t as a developer yet. So I kept studying, and after
                  a year I was across the base of
                  <span className="language">HTML, CSS, Javascript and PHP</span>, just enough to
                  build a something real!
                </p>
                <p>
                  Back in early 2017, a friend that I met doing radio shows in France told me that he
                  had long been considering creating a personal portfolio for his photos. So with my
                  freshly developed skills, I decided to grant my friend his wish and spent a
                  considerable amount of time building
                  <a className="animated" href="http://www.skiagraphie.fr">
                    Skiagraphie
                  </a>
                  , my <span className="italic">first complete website</span>. When I look at the code
                  now, I don&apos;t know whether I should laugh or cry, but as everyone knows, first
                  love never dies, so I can look beyond its blemishes! Above all it, having
                  Skiagraphie complete and functional opened the door for me to work as a front-end
                  developer for
                  <a className="animated" href="https://www.triplesense.it/">
                    Reply
                  </a>
                  .
                </p>
                <p>
                  I started to work with
                  <span className="language">AngularJS</span> (1.5, before
                  <span className="language">Typescript</span>...it&apos;s been ages!),
                  <span className="language">Javascript ES6 and SCSS</span>. Of course, I learned a
                  lot of things, ranging from stupid to very useful, things like how to use{' '}
                  <span className="language">Git</span> or adjust a{' '}
                  <span className="language">Webpack</span> configuration, handle an API error
                  response...everything that a front-end developer HAS to know to survive in the
                  modern jungle.
                </p>
                <p>
                  In the meantime I embarked on a new personal project, a neverending travelblog,
                  <a className="animated" href="http://www.cartedevoyages.com">
                    Carte de Voyages
                  </a>
                  . The project includes three parts: a CMS for data-entry (at the moment it&apos;s
                  written in <span className="language">AngularJS</span>), a server with a{' '}
                  <span className="language">REST API in ExpressJS</span>, and of course a front-end
                  part that I recently rewrote in
                  <span className="language">Nuxt (VueJS)</span>. This project deserves its own blog
                  post (that I will write someday), so I will just say that I learned an incalculable
                  amount with this project, and it confirmed my desire to doing things the right way
                  and to always take the better path, even if it&apos;s longer. Of course, I&apos;m
                  still a bit frustrated to not be able to show it, but that frustration pales in
                  comparison to my appeciation for the lessons that it has given me so far.
                </p>
              </Readmore>
            </div>
            <div className="py-4 md:py-8">
              <h2>Personal things</h2>
              <Readmore>
                <p>
                  I love music and culture...But especially music! I can talk about it for hours, and
                  I did as the host of a number of radio shows that are not maintained anymore. You
                  can find some podcasts on this
                  <a className="animated" href="https://www.mixcloud.com/UpsetTheRythm/">
                    Mixcloud
                  </a>
                  , or in this
                  <a className="animated" href="https://www.mixcloud.com/Mangiarane/">
                    other one
                  </a>
                  . My presentation is of course all in French, but the language of music is
                  universal! Feel also free to take a look at my
                  <Link className="mr-1 animated" href="/lists/my-discogs">
                    Discogs wantlist
                  </Link>
                  (a vinyl is always a beautiful gift <span>&#128521;</span>)
                  <br />
                </p>
                <p>
                  I love to travel, and it&apos;s that love that spawned the idea for my travelblog.
                  Unfortunately I don&apos;t get to do it as often as I would like, but I suppose that
                  I would feel that way no matter what!
                </p>
                <p>
                  Oh and one other thing: I feel engaged by the ideas of ecological living and so I
                  work on making sustainable choices and doing everything in my power to change things
                  for a better, greener planet
                  <span>&#128516;</span>
                </p>
              </Readmore>
            </div>
          </div>
        </div>
      </div>
    </DefaultLayout>
  )
}

export default About
