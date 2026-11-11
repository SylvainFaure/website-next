const uniqBy = require('lodash.uniqby')

const mapDiscsToItems = (results, type = 'wants') => {
  const items = results[type].map(el => {
    el.basic_information.title = el.basic_information.title.replace(/\(.\)/gm, '').trim()
    el.link = `https://www.discogs.com/fr/sell/release/${el.basic_information.id}?ev=rb`
    return el
  })
  const uniqItems = uniqBy(items, 'basic_information.title')
  const sortedItems = uniqItems.sort((a, b) => Date.parse(new Date(b.date_added)) - Date.parse(new Date(a.date_added)) )
  return {
    [type]: sortedItems,
    pagination: results.pagination
  }
}

module.exports = { mapDiscsToItems }