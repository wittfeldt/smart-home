var chai = require("chai")
var should = chai.should()
var MemoryStream = require("memory-stream")
var _1WireReader = require("../../lib/1-wire/Stream")

describe('1WireReader', function() {
    
    var memStream = null
    
    before(function(done) {
        var reader = new _1WireReader({
            path: __dirname + "/fixtures/*/w1_slave"
        })
        memStream = new MemoryStream({ objectMode: true })
        reader.pipe(memStream).on('finish', done)
        
        setTimeout(function() { reader.push(null) }, 100)
    })
    
    it("emits valid reading containing id and temperature", function(done) {
        memStream.buffer.should.include({
            id: "28-OK_CRC",
            temperature: 33
        })
        done()
    })
    
    it("does not emit readings with bad CRC", function(done) {
        memStream.buffer.should.not.include({
            id: "28-BAD_CRC",
            temperature: 33
        })
        done()
    })
    
    it("emits key + value for unknown sensor families", function(done) {
        memStream.buffer.should.include({
            id: "42-OK_CRC",
            defcon: "3"
        })
        done()
    })
})