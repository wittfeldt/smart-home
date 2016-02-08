/* Duplex stream for Tellstick Duo
*/

var Duplex = require("stream").Duplex
var inherits = require("util").inherits

function TellstickDuplex() {
    this._init(host)

    Duplex.call(this, { objectMode: true })
}

inherits(TellstickDuplex, Duplex)

TellstickDuplex.prototype._init = function() {
    this.events = new require("tellsock").TelldusEvents()
    this.client = new require("tellsock").TelldusClient()
    
    this.events.on("raw", this.push.bind(this))
    
    this.events.on("end", function() {
        console.log("Reconnecting")
        setTimeout(this._init.bind(this), 3000)
    }.bind(this))
}

TellstickDuplex.prototype._read = function (size) {
}

// [ command, deviceId, arg1, ... ]
TellstickDuplex.prototype._write = function (arr, enc, done) {
    this.client([arr.splice(0,1)].apply(this.client, arr))
    done()
}

module.exports = TellstickDuplex