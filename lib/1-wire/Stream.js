/* Readable stream for 1-Wire sensors
*/

var Readable = require("stream").Readable
var inherits = require("util").inherits
var Promise = require("bluebird")
var fs = require('fs')
var _ = require("lodash")

var glob = Promise.promisify(require('glob'))
var readFile = Promise.promisify(fs.readFile)
var Reading = require("./Reading")

function _1WireStream(options) {
    options = options || {}
    this.options = _.merge(this.defaultOptions, options)
    
    Readable.call(this, { objectMode: true })
    
    this._start()
}

inherits(_1WireStream, Readable)

_1WireStream.prototype._start = function() {
    this._poll()
    setInterval(this._poll.bind(this), this.options.interval)
}

_1WireStream.prototype._poll = function() {
    var self = this
    glob(this.options.path)
    .then(function(paths) {
        return Promise.map(paths, self._readSensor.bind(self))
    })
    .then(function(readings) {
        _.filter(readings, function(r) { 
            return r.crc() 
        }).forEach(function(r) {
            self.push(r.toJSON())
        })
    })
}

_1WireStream.prototype._format = function(data) {
    return {
        value: data
    }
}

_1WireStream.prototype._readSensor = function (path) {
    return readFile(path)
    .then(function(data) {
        return new Reading(path, data.toString())
    }.bind(this))
}

_1WireStream.prototype._read = function (size) {
}

_1WireStream.prototype.defaultOptions = {
    path: "/sys/bus/w1/devices/*/w1_slave",
    interval: 30*1000
}

module.exports = _1WireStream