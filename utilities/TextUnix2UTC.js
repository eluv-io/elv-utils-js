/* eslint-disable no-console */
'use strict'
const prompt = require('prompt')

const schema = {
  properties: {
    text: {
      description: 'Enter Unix epoch (milliseconds or seconds) to convert to UTC',
      required: true,
      type: 'string'
    }
  }
}

console.log()

prompt.start()
prompt.message = ''
prompt.colors = false

prompt.get(schema, (err, result) => {
  if (err) {
    return onErr(err)
  }
  const inputInt = parseInt(result.text, 10)
  const inputHasAtLeast10Digits = Math.log10(inputInt) >= 10
  // adjust

  const milliseconds = inputHasAtLeast10Digits
    ? inputInt
    : inputInt * 1000

  let utcString

  try {
    const dateObject = new Date(milliseconds)
    utcString = dateObject.toISOString()
  } catch (e) {
    return onErr(e)
  }
  console.log()
  console.log('Input received')
  console.log('--------------------------')
  console.log(result.text)
  if (inputHasAtLeast10Digits) {
    console.log('(10 or more digits, assumed to be milliseconds)')
  } else {
    console.log('(less than 10 digits, assumed to be seconds)')
  }
  console.log()
  console.log('Converted to UTC')
  console.log('--------------------------')
  console.log(utcString)
  console.log()
})

function onErr(err) {
  console.log(err.toString())
  return 1
}
