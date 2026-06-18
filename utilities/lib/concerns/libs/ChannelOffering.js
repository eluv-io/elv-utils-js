// Code for working with channel (composition) offerings
'use strict'

const clone = require('@eluvio/elv-js-helpers/Functional/clone')
const fraction = require('@eluvio/elv-js-helpers/Conversion/fraction')
const isEquivalent = require('@eluvio/elv-js-helpers/Boolean/isEquivalent')
const pluck = require('@eluvio/elv-js-helpers/Functional/pluck')
const uniq = require('@eluvio/elv-js-helpers/Functional/uniq')

const ChOffPlayout = require('./ChOffPlayout')

const blueprint = {
  name: 'ChannelOffering',
  concerns: []
}

const oldItemsToSlices = (sourceLinks, items) => items.map(
  i => [
    sourceLinks.findIndex(isEquivalent(i.source)),
    fraction(i.slice_start_rat).n,
    fraction(i.slice_start_rat).d,
    fraction(i.slice_end_rat).n,
    fraction(i.slice_end_rat).d
  ]
)

const oldItemsUniqueSourceLinks = items => clone(uniq(pluck('source', items)))

// upgrade : Object -> Object
// Take an object in old format and upgrade
const upgrade = old => {
  // assemble unique sources
  const sourceLinks = oldItemsUniqueSourceLinks(old.items)
  // convert items to slices
  const slices = oldItemsToSlices(sourceLinks, old.items)

  return {
    description: old.description,
    display_image: old.display_image,
    display_name: old.display_name,
    playout: ChOffPlayout.upgrade(old.playout),
    slices,
    sources: sourceLinks.map(
      link => Object({
        source: link,
        type: 'mez_vod'
      })
    )
  }

}

const New = () => {

  // instance interface
  return {}
}

module.exports = {
  blueprint,
  upgrade,
  New
}
