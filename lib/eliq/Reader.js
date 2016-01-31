/* Readable stream for Eliq API events
*/

var Readable = require("stream").Readable
var inherits = require("util").inherits
var request = require("request-promise")
var _ = require("lodash")

var API_BASEURL = "https://my.eliq.se/api/datanow?accesstoken="

function EliqReader(options) {
    this._setOptions(options || {})
    this.uri = API_BASEURL + this.options.apiKey
    
    Readable.call(this, { objectMode: true })
    this._start()
}

inherits(EliqReader, Readable)

EliqReader.prototype._read = function (size) {
}

EliqReader.prototype._start = function() {
    this._poll()
    setInterval(this._poll.bind(this), this.options.interval)
}

EliqReader.prototype._poll = function() {
    request.get(this.uri)
    .then(function(body) {
        var reading = this._parse(body)
        this.push(reading)
    }.bind(this))
    .catch(function(err) {
        console.error("Eliq.poll", err.stack)
    })
}

EliqReader.prototype._parse = function(body) {
    var ev = JSON.parse(body)
    if (ev.channelid && ev.power) {
        return {
            id: "eliq/" + ev.channelid,
            power: ev.power,
        }
    } else {
        throw new Error("EliqStream received invalid event: " + ev)
    }
}

EliqReader.prototype._setOptions = function(options) {
    this.options = _.merge(this.defaultOptions, options)
    if (!this.options.apiKey)
        throw new Error("apiKey is required");
}

EliqReader.prototype.defaultOptions = {
    interval: 10*60*1000
}

module.exports = EliqReader