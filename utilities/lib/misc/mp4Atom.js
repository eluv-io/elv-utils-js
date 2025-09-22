'use strict'
const curry = require('crocks/helpers/curry')

const {
  ObjectModel,
  NonNegativeInteger,
  PositiveInteger
} = require('../models/Models')


const MP4AtomReadContextModel = ObjectModel(
  {
    buffer: Buffer,
    currentAtomLength: PositiveInteger,
    currentAtomStart: NonNegativeInteger,
    posWithinAtom: NonNegativeInteger
  })
  .assert(x => x.currentAtomLength >= 8, ()=>'currentAtomLength must be >= 8')
  .assert(x => x.posWithinAtom < x.currentAtomLength, ()=>'posWithinAtom must be < currentAtomLength')
  .assert(x => (x.currentAtomStart + x.currentAtomLength) <= x.buffer.length,()=> 'currentAtomStart + currentAtomLength must be <= buffer.length')

class MP4AtomReadContext extends MP4AtomReadContextModel
{

  get currentAtomBytesLeft() {
    return this.currentAtomLength - this.posWithinAtom
  }

  get currentAtomEnd() {
    return this.currentAtomStart + this.currentAtomLength
  }

  get currentBufPos() {
    return this.currentAtomStart + this.posWithinAtom
  }
}

// enter atom under read head, then move read head past header (length and type fields)
const enter = readContext => {
  let {atomType, atomLength, headerLength} = readHeader(readContext)
  // logger.log(`Entering atom '${atomType}', atom start = ${readContext.currentBufPos}, skipping ${headerLength} byte header`);
  return new MP4AtomReadContext(
    {
      buffer: readContext.buffer,
      currentAtomLength: atomLength,
      currentAtomStart: readContext.currentBufPos,
      currentAtomType: atomType,
      posWithinAtom: headerLength
    }
  )
}

// Read atoms without entering, looking for particular atom atomType(s)
// The read head must be at the start of any atom (reading the next 4 bytes must return the length field)
const find = curry(
  (atomTypes, readContext) => {
    let eof = false
    let found = false
    while(!found && !eof) {
      let {atomType, atomLength} = readHeader(readContext)
      if(atomTypes.includes(atomType)) {
        found = true
      } else {
        // skip to next atom
        readContext = moveWithin(atomLength, readContext)
        // check if we have run out of data
        if(readContext.posWithinAtom === readContext.currentAtomLength) eof = true
      }
    }
    if(!found) throw Error(`Atom type(s) not found: ${atomTypes}`)

    return readContext
  }
)

const findAndEnter = curry(
  (atomTypes, readContext) => {
    return enter(find(atomTypes, readContext))
  }
)

const moveWithin = curry(
  (offset, readContext) => {
    // logger.log(`Move within atom: ${offset} bytes`);

    const newPosWithinParent = readContext.posWithinAtom + offset
    if(newPosWithinParent >= readContext.currentAtomLength) throw Error('Cannot move past end of atom')
    if(newPosWithinParent < 0) throw Error('Cannot move before beginning of atom')
    return new MP4AtomReadContext({
      buffer: readContext.buffer,
      currentAtomLength: readContext.currentAtomLength,
      currentAtomStart: readContext.currentAtomStart,
      currentAtomType: readContext.currentAtomType,
      posWithinAtom: newPosWithinParent
    })
  }
)


const newContextFromBuffer = buffer => {
  return new MP4AtomReadContext({
    buffer,
    currentAtomLength: buffer.length,
    currentAtomStart: 0,
    currentAtomType: '',
    posWithinAtom: 0
  })
}

const readAtom = readContext => {
  const {atomLength} = readHeader(readContext)
  const atomStart = readContext.currentBufPos
  const atomEnd = atomStart + atomLength
  return readContext.buffer.subarray(atomStart, atomEnd)
}

const readHeader = readContext => {
  const {buffer, currentAtomBytesLeft, currentBufPos} = readContext
  let headerLength = 8

  if(currentAtomBytesLeft < headerLength) throw Error('Cannot read atom, not enough bytes available to hold atomLength + type fields')

  // read 4 bytes to get atomLength
  let atomLength = buffer.readUInt32BE(currentBufPos)
  if(atomLength === 0 || (atomLength > 1 && atomLength < 8)) throw Error(`Invalid length 0 found: ${atomLength}`)

  // read 4 bytes to get atom type
  const atomType = buffer.toString('ascii', currentBufPos + 4, currentBufPos + 8)

  // if atomLength === 1, need to read 8 more bytes to get 64-bit atomLength
  if(atomLength === 1) {
    headerLength = 16
    if(currentAtomBytesLeft < headerLength) throw Error('Cannot read atom, not enough bytes available to hold 64-bit atomLength field')
    atomLength = buffer.readUInt64BE(currentBufPos + 8)
  }

  if(atomLength > currentAtomBytesLeft) {
    throw Error(`Invalid length found: ${atomLength} (only ${currentAtomBytesLeft} available)`)
  }

  return {atomLength, atomType, headerLength}
}

module.exports = {
  enter,
  find,
  findAndEnter,
  moveWithin,
  MP4AtomReadContext,
  newContextFromBuffer,
  readAtom,
  readHeader
}
