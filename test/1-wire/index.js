var chai = require("chai")
var should = chai.should()
var MemoryStream = require("memory-stream")
var W1Reader = require("../../lib/1-wire/Reader")

describe('1WireReader', function() {
    
    var memStream = null
    
    before(function(done) {
        var reader = new W1Reader({
            path: __dirname + "/fixtures/*/w1_slave"
        })
        memStream = new MemoryStream({ objectMode: true })
        reader.pipe(memStream).on('finish', done)
        
        setTimeout(function() { reader.push(null) }, 100)
    })
    
    it("emits valid reading containing id and temperature", function(done) {
        // console.log(memStream.buffer)
        memStream.buffer.should.include({
            id: "1-wire/28-OK_CRC",
            temperature: 33
        })
        done()
    })
    
    it("does not emit readings with bad CRC", function(done) {
        memStream.buffer.should.not.include({
            id: "1-wire/28-BAD_CRC",
            temperature: 33
        })
        done()
    })
    
    it("emits key + value for unknown sensor families", function(done) {
        memStream.buffer.should.include({
            id: "1-wire/42-OK_CRC",
            defcon: "3"
        })
        done()
    })
})