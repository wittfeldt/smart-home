/* Readable stream for tellsock events
*/

var Duplex = require("stream").Duplex
var inherits = require("util").inherits
var Local = require("./Local")
var Remote = require("./Remote")

function TellstickStream(host) {
    this._init(host)
    Duplex.call(this, { objectMode: true })
}

inherits(TellstickStream, Duplex)

TellstickStream.prototype._init = function(host) {
    this.tellstick = (!host || host == "localhost") ?
        new Local() : 
        new Remote(host);
    
    this.tellstick.events.on("event", this.push.bind(this))
}

TellstickStream.prototype._read = function (size) {
}

// [ command, deviceId, arg1, ... ]
TellstickStream.prototype._write = function (arr, enc, done) {
    this.tellstick([arr.splice(0,1)].apply(this.client, arr))
    done()
}

module.exports = TellstickStream