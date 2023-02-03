/* eslint-disable no-console */
const prompt = require('prompt')
const escape=require('shell-escape')

const schema = {
  properties: {
    text: {
      description: 'Enter text to convert',
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
  console.log()
  console.log('Input received:')
  console.log('---------------------')
  console.log(result.text)
  console.log()
  console.log('Converted for command line:')
  console.log('---------------------')
  console.log(escape([result.text]))
  console.log()
})

function onErr(err) {
  console.log(err)
  return 1
}
