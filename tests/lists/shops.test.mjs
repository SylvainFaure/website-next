import { test } from 'node:test'
import assert from 'node:assert/strict'
import { shopLinks } from '../../src/service/lists/shops.js'

test('French books link to leslibraires.fr, by ISBN when known', () => {
  const book = { title: "L'Anomalie", author: 'Hervé Le Tellier', lang: 'fr', isbn: null }
  assert.deepEqual(shopLinks(book), [
    {
      key: 'leslibraires',
      name: 'Leslibraires.fr',
      href: "https://www.leslibraires.fr/recherche/?q=L'Anomalie%20Herv%C3%A9%20Le%20Tellier"
    }
  ])
  assert.equal(shopLinks({ ...book, isbn: '9782072965821' })[0].href, 'https://www.leslibraires.fr/recherche/?q=9782072965821')
})

test('Italian books link to Ubik and Librerie.coop', () => {
  const book = { title: 'Le perfezioni', author: 'Vincenzo Latronico', lang: 'it', isbn: null }
  const links = shopLinks(book)
  assert.deepEqual(links.map((l) => l.key), ['ubik', 'coop'])
  assert.equal(links[0].href, 'https://www.ubiklibri.it/catalogo-libri?q=Le%20perfezioni')
  assert.equal(links[1].href, 'https://www.librerie.coop/search/?q=Le%20perfezioni%20Vincenzo%20Latronico')
  const withIsbn = shopLinks({ ...book, isbn: '9788830118683' })
  assert.equal(withIsbn[0].href, 'https://www.ubiklibri.it/catalogo-libri?q=9788830118683')
  // Librerie.coop's search doesn't handle ISBNs
  assert.equal(withIsbn[1].href, links[1].href)
})

test('unknown languages have no links', () => {
  assert.deepEqual(shopLinks({ title: 'x', author: 'y', lang: 'en' }), [])
})
