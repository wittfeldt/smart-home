var Writable = require("stream").Writable
var inherits = require("util").inherits
var TelldusClient = require('tellsock').TelldusClient

var tc = new TelldusClient()

function CommandEmitter() {
    Writable.call(this, { objectMode: true })
}

inherits(CommandEmitter, Writable)

CommandEmitter.prototype.sendCommand = function(house, unit, method) {
    process.stdout.write(new Date + " - " + house + "/" + unit + " " + method)
    try {
        var pair = this.buttonMap[house][unit]
        if (!pair) throw new Error();
        console.log(" " + pair[0] + " " + (method == "turnon" ? pair[1] : ""))

    } catch(err) {
        console.error(" not mapped")
    }
}


CommandEmitter.prototype._write = function (chunk, encoding, done) {
    setTimeout(function() {
        chunk.method == "turnon" ?
            tc.tdDim(chunk.tdDevice, chunk.dimLevel) :
            tc.tdTurnOff(chunk.tdDevice)

      done()
    }.bind(this),0)
}

module.exports = CommandEmitter
