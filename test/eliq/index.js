var chai = require("chai")
var should = chai.should()
var sinon  = require('sinon')
var MemoryStream = require("memory-stream")
var Promise = require("bluebird")
var request = require("request-promise")
var EliqReader = require("../../lib/eliq/Reader")

describe('EliqReader', function() {
    
    var memStream = null
    
    before(function(done) {
                
        sinon.stub(request,'get', function() {
            setTimeout(function() { reader.push(null) }, 100)
            return Promise.resolve(JSON.stringify({
                channelid: 9,
                createddate: "0000-00-00T00:00:00",
                power: 1881.0
            }))
        })

        var reader = new EliqReader({ apiKey: "doesnotmatter"})
        
        memStream = new MemoryStream({ objectMode: true })
        reader.pipe(memStream).on('finish', done)
    })
    
    it("emits a power reading", function(done) {
        memStream.buffer[0].should.eql({ 
            id: 'eliq/9', 
            power: 1881 
        })
        done()
    })
})