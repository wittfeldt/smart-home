/* Readable stream for DS18B20 sensors
*/

var Readable = require("stream").Readable
var inherits = require("util").inherits
var fs = require('fs')
var Promise = require("bluebird")
var _ = require("lodash")

var glob = Promise.promisify(require('glob'))
var readFile = Promise.promisify(fs.readFile)

function DS18B20Reader(glob, interval) {
    this.glob = glob || "/sys/bus/w1/devices/*/w1_slave"
    this.buf = []
    setInterval(this.poll.bind(this), interval || 30*1000)
    this.poll()

    Readable.call(this, {objectMode: true})
}

inherits(DS18B20Reader, Readable)

DS18B20Reader.prototype.poll = function() {
    var self = this
    this.readSensors()
    .then(function(readings) {
        _.each(readings, function(reading) {
            self.buf.push(reading)
            if (!this.writing) self.push(self.buf.shift());
        })
    })
}

DS18B20Reader.prototype.readSensors = function (paths) {
    var readSensor = function(path) {
        return readFile(path)
        .then(function(data) {
            var parts = path.split("/")
            var reading = {
                id: parts[parts.length-2],
                data: data.toString(),
                protocol: "1-wire",
                model: "temperature"
            }
            reading["class"] = "sensor"
            return reading
        })
    }
    return glob(this.glob)
    .then(function(paths) {
        return Promise.map(paths, readSensor.bind(this))
    }.bind(this))
}

DS18B20Reader.prototype._read = function (size) {
    if (this.writing) return;
    this.writing = true
    while (this.buf.length && size--) {
        if (this.push(this.buf.shift()) === false) break;
    }
    this.writing = false
}

module.exports = DS18B20Reader