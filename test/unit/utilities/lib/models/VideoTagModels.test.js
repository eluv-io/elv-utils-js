const TH = require('../../../../test-helpers')
const VTM = require('../../../../../utilities/lib/models/VideoTagModels')

const shotTagsTrack = () => Object.fromEntries([
  [
    VTM.SUMMARY_TRACK_KEY_SHOT_TAGS,
    {
      label: 'Shot Tags',
      tags: [
        {
          start_time: 0,
          end_time: 100,
          text: {
            'Celebrity Detection': [
              {
                start_time: 0,
                end_time: 100,
                text: 'Batman'
              }
            ]
          }
        }
      ]
    }
  ]
])


describe('VideoTagModel', () => {

  it('should reject tags with start time > end time', () => {
    TH.expect(function () {
      VTM.VideoTagModel({
        start_time: 100,
        end_time: 90,
        text: 'foo'
      })
    }).to.throw('Value start_time must be <= end_time (got: {"start_time":100,"end_time":90,"text":"foo"})')
  })

  it('should reject tags missing start_time', () => {
    TH.expect(function () {
      VTM.VideoTagModel({
        end_time: 110,
        text: 'foo'
      })
    }).to.throw('expecting start_time to be Number, got undefined')
  })

  it('should reject tags missing text', () => {
    TH.expect(function () {
      VTM.VideoTagModel({
        start_time: 100,
        end_time: 110
      })
    }).to.throw('expecting text to be NonBlankString or Array of NonBlankString, got undefined')
  })

  it('should accept tags containing extra fields', () => {
    VTM.VideoTagModel({
      start_time: 100,
      end_time: 110,
      text: ['foo', 'bar'],
      tags: {a: 1}
    })
  })

})

describe('VideoTagTracksInputModel', () => {
  const exampleTags = TH.exampleVideoTags()

  it('should accept the example file "video_tags.json', () => {
    VTM.VideoTagTracksInputModel(exampleTags)
  })

  const badTrack = Object.fromEntries([
    [
      VTM.SUMMARY_TRACK_KEY_SHOT_TAGS,
      {
        label: 'Shot Tags',
        tags: []
      }
    ]
  ])

  const badInput = Object.assign(badTrack, exampleTags)
  it('should reject input that contains a track with the magic summary track name', () => {
    TH.expect(function () {
      VTM.VideoTagTracksInputModel(badInput)
    }).to.throw('Input cannot contain a tag track with key "shot_tags"')
  })

  const shotTags = shotTagsTrack()
  const badInput2 = Object.assign(shotTags, exampleTags)
  it('should reject input that contains an actual shot_tags track', () => {
    TH.expect(function () {
      VTM.VideoTagTracksInputModel(badInput2)
    }).to.throw('Input cannot contain a tag track with key "shot_tags"')
  })
})


describe('VideoTagsTracksFileMetadataTagsModel', () => {
  const exampleTags = TH.exampleVideoTags()

  // ?? should we require 'shot_tags' ?? should we have this fail??
  it('should accept the example file "video_tags.json', () => {
    VTM.VideoTagsTracksFileMetadataTagsModel(exampleTags)
  })

  const shotTags = shotTagsTrack()
  const goodFile = Object.assign(shotTags, exampleTags)
  it('should accept input that contains a track with a shot_tags track', () => {
    VTM.VideoTagsTracksFileMetadataTagsModel(goodFile)
  })
})