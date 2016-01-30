/* Readable stream for DS18B20 sensors
*/

var Readable = require("stream").Readable
var inherits = require("util").inherits
var Promise = require("bluebird")
var fs = require('fs')

var glob = Promise.promisify(require('glob'))
var readFile = Promise.promisify(fs.readFile)

function Reader(path, interval) {
    this.path = path || "/sys/bus/w1/devices/*/w1_slave"
    setInterval(this._poll.bind(this), interval || 30*1000)
    this._poll()

    Readable.call(this, {objectMode: true})
}

inherits(Reader, Readable)

Reader.prototype._poll = function() {
    var self = this
    return glob(this.path)
    .then(function(paths) {
        return Promise.map(paths, self._readSensor.bind(this))
    })
    .then(function(readings) {
        readings.forEach(function(reading) {
            self.push(reading)
        })
    })
}

Reader.prototype._format = function(data) {
    return {
        value: data
    }
}

Reader.prototype._readSensor = function (path) {
    return readFile(path)
    .then(function(data) {
        var parts = path.split("/")
        return _.merge({ 
            id: parts[parts.length-2] 
        }, this.cb(data))
    }.bind(this))
}

Reader.prototype._read = function (size) {
}

module.exports = Reader