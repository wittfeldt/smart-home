/* Readable stream for Eliq API events
*/

var Readable = require("stream").Readable
var inherits = require("util").inherits
var request = require("request-promise")
var _ = require("lodash")

var API_BASEURL = "https://my.eliq.se/api/datanow?accesstoken="

function Eliq(options) {
    this.options = _.merge(this.defaultOptions, (options || {}))
    this.uri = API_BASEURL + this.options.apiKey
    
    Readable.call(this, { objectMode: true })
    this._start()
}

inherits(Eliq, Readable)

Eliq.prototype._start = function() {
    this._poll()
    setInterval(this._poll.bind(this), this.options.interval)
},

Eliq.prototype._poll = function() {
    var self = this
    return request.get(this.uri)
    .then(this._parse.bind(this))
    .then(this.push.bind(this))
    .catch(console.error)
},

Eliq.prototype._parse = function(body) {
    var body = JSON.parse(body)
    if (body.channelid && body.power) {
        return {
            id: "eliq" + body.channelid,
            power: body.power
        }
    } else {
        throw new Error("EliqStream._parse: " + body)
    }
}

Eliq.prototype._read = function (size) {
},

Eliq.prototype.defaultOptions = {
    interval: 60*1000
}

module.exports = Eliq