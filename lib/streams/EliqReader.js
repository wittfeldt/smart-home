/* Readable stream for Eliq API events
*/

var Readable = require("stream").Readable
var inherits = require("util").inherits
var request = require("request-promise")
var _ = require("lodash")

var mixins = require("../mixins")
var extend = mixins.extend

var API_BASEURL = "https://my.eliq.se/api/datanow?accesstoken="

function EliqReader(options) {
    this._setOptions(options, [ "apiKey" ])
    this.uri = API_BASEURL + this.options.apiKey
    
    Readable.call(this, { objectMode: true })
    this._start()
}

inherits(EliqReader, Readable)
extend(EliqReader.prototype, mixins.options)
extend(EliqReader.prototype, mixins.polling)

EliqReader.prototype._readSensors = function() {
    return request.get(this.uri)
    .then(function(body) {
        return [ this._parse(body) ]
    }.bind(this))
    .catch(function(err) {
        console.error("Eliq.poll", err.stack)
        return []
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

module.exports = EliqReader