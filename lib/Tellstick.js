/* Duplex stream for Tellstick (Duo)
*/

var Duplex = require("stream").Duplex
var inherits = require("util").inherits
var tellsock = require("tellsock")

function Tellstick() {
    this._init()

    Duplex.call(this, { objectMode: true })
}

inherits(Tellstick, Duplex)

Tellstick.prototype._init = function() {
    this.events = new tellsock.TelldusEvents()
    this.client = new tellsock.TelldusClient()
    
    this.events.on("raw", this.push.bind(this))
    
    this.events.on("end", function() {
        console.log("Reconnecting")
        setTimeout(this._init.bind(this), 3000)
    }.bind(this))
}

Tellstick.prototype._read = function (size) {
}

// [ command, deviceId, arg1, ... ]
Tellstick.prototype._write = function (arr, enc, done) {
    this.client[arr.splice(0,1)].apply(this.client, arr)
    done()
}

module.exports = Tellstick