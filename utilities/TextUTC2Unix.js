/* eslint-disable no-console */
'use strict'
const prompt = require('prompt')
const utcStrToDate = require('@eluvio/elv-js-helpers/Datetime/utcStrToDate')

const schema = {
  properties: {
    text: {
      description: 'Enter UTC timestamp (e.g. 2022-01-01T14:00:00Z or 2022-01-01T14:00:00.000000Z) to convert to Unix epoch milliseconds',
      required: true,
      type: 'string'
    }
  }
}

console.log()

prompt.start()
prompt.message = ''
prompt.colors = false

prompt.get(schema,  (err, result) => {
  if(err) { return onErr(err) }
  let unixTimeVal
  try {
    unixTimeVal = utcStrToDate(result.text).valueOf()
  } catch (e) {
    return onErr(e)
  }
  console.log()
  console.log('Input received')
  console.log('--------------------------')
  console.log(result.text)
  console.log()
  console.log('Converted to Unix epoch milliseconds')
  console.log('--------------------------')
  console.log(unixTimeVal)
  console.log()
})

function onErr(err) {
  console.log(err.toString())
  return 1
}
