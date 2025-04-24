/* eslint-disable no-console */
'use strict'
const prompt = require('prompt')
const base58Decode=require('@eluvio/elv-js-helpers/Conversion/base58Decode')

const schema = {
  properties: {
    text: {
      description: 'Enter text to decode from Base58',
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
  let decodedStr
  try {
    decodedStr = Buffer.from(base58Decode(result.text)).toString('hex')
  } catch (e) {
    return onErr(e)
  }
  console.log()
  console.log('Input received')
  console.log('--------------------------')
  console.log(result.text)
  console.log()
  console.log('Decoded from Base58')
  console.log(`(decoded length: ${decodedStr.length} digits)`)
  console.log('--------------------------')
  console.log(`0x${decodedStr}`)
  console.log()
})

function onErr(err) {
  console.log(err.toString())
  return 1
}
