const TH = require('../../../test-helpers')
const VTM = require('../../../../utilities/lib/models/VideoTagsModel')


describe('VideoMetadataTagModel', () => {

  it('should reject tags with start time > end time', () => {
    TH.expect(function () {
      VTM.VideoMetadataTagModel({
        start_time: 100,
        end_time: 90,
        text: 'foo'
      })
    }).to.throw('Value start_time must be <= end_time (got: {"start_time":100,"end_time":90,"text":"foo"})')
  })

  it('should reject tags missing start_time', () => {
    TH.expect(function () {
      VTM.VideoMetadataTagModel({
        end_time: 110,
        text: 'foo'
      })
    }).to.throw('expecting start_time to be Number, got undefined')
  })

  it('should reject tags missing text', () => {
    TH.expect(function () {
      VTM.VideoMetadataTagModel({
        start_time: 100,
        end_time: 110
      })
    }).to.throw('expecting text to be NonBlankString or Array of NonBlankString, got undefined')
  })

  it('should accept tags containing extra fields', () => {
    VTM.VideoMetadataTagModel({
      start_time: 100,
      end_time: 110,
      text: ['foo', 'bar'],
      tags: {a: 1}
    })
  })

})
