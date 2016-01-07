/* Readable stream for tellsock events
*/

var TelldusEvents = require('tellsock').TelldusEvents
var Readable = require("stream").Readable
var inherits = require("util").inherits

function TellstickStream(eventType) {
    this.buf = []
    this.writing = false
    
    this.events = new TelldusEvents()
    this.events.on(eventType, function(pl) {
        this.buf.push(pl)
        if (!this.writing) this.push(this.buf.shift());
    }.bind(this))
    
    Readable.call(this, {objectMode: true})
}

inherits(TellstickStream, Readable)

TellstickStream.prototype._read = function (size) {
    if (this.writing) return;
    this.writing = true
    while (this.buf.length && size--) {
        if (this.push(this.buf.shift()) === false) break;
    }
    this.writing = false
}

module.exports = TellstickStream
