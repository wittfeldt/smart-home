/* Readable stream for Eliq API events
*/

var Readable = require("stream").Readable
var inherits = require("util").inherits
var request = require("request")

function EliqStream(apiKey) {
    this.uri = "https://my.eliq.se/api/datanow?accesstoken=" + apiKey
    setInterval(this.poll.bind(this), 10*60*1000)
    Readable.call(this, { objectMode: true })
}

inherits(EliqStream, Readable)

EliqStream.prototype._read = function (size) {
}

EliqStream.prototype.poll = function() {
    request(this.uri, function(err, res, body) {
        try {
            var ev = JSON.parse(body)
            if (ev.channelid && ev.power) {
                var reading = {
                    id: "eliq" + ev.channelid,
                    power: ev.power,
                    protocol: "eliq",
                    model: "energymeter"
                }
                reading["class"] = "sensor"
                this.push(reading)
            }
        } catch(err) {
            console.error("Eliq.poll", err.stack)
        }
    }.bind(this))
}

module.exports = EliqStream