/* Readable stream for 1-Wire sensors
*/

var Readable = require("stream").Readable
var inherits = require("util").inherits
var Promise = require("bluebird")
var fs = require("fs")
var _ = require("lodash")

var glob = Promise.promisify(require("glob"))
var readFile = Promise.promisify(fs.readFile)

function OneWire(options) {
    this.options = _.merge(this.defaultOptions, (options || {}))
    Readable.call(this, { objectMode: true })
    this._start()
}

inherits(OneWire, Readable)

OneWire.prototype._start = function() {
    this._poll()
    setInterval(this._poll.bind(this), this.options.interval)
},

OneWire.prototype._poll = function() {
    var self = this
    this._readSensors()
    .then(function(readings) {
        _.each(readings, function(r) {
            self.push(r)
        })
    })
},

OneWire.prototype._read = function (size) {
},

OneWire.prototype._readSensors = function() {
    return Promise.map(
        glob(this.options.path), 
        this._readSensor.bind(this)
    )
    .filter(function(reading) { 
        return (reading != undefined)
    })
}

OneWire.prototype._readSensor = function (path) {
    return readFile(path)
    .then(function(data) {
        return this._parse(path, data)
    }.bind(this))
}

OneWire.prototype._parse = function(path, data) {
    var lines = data.toString().split("\n")
    if (lines[0].match(/YES$/)) { // CRC
        var sensorInfo = this._sensorInfo(path)
        return _.merge(
            { id: "1wire" + sensorInfo.id },
            sensorInfo.parser(lines[1]))
    }
}

OneWire.prototype._sensorInfo = function(path) {
    var parts = path.split("/");
    var id = parts[parts.length-2]
    var family = id.split("-")[0]
    return {
        id: id,
        parser: OneWire.parsers[parseInt(family)] || parsers.default
    }
}

OneWire.prototype.defaultOptions = {
    interval: 60*1000,
    path: "/sys/bus/w1/devices/*/w1_slave"
}

OneWire.parsers = {
    // DS18X20/DS1822 Temperature sensor
    28: function(line) {
        var match = line.match(/t=([0-9]+)$/)
        var val = match[1]
        if (val && !isNaN(val)) {
            return {
                temperature: parseInt(val) / 1000
            }
        } else {
            console.error("Could not parse temperature:", line)
        }
    },
    
    // Default parser, output key = value or raw string
    default: function(line) {
        var m = line.match(/^.* ([^=]*)=(.*)$/)
        if (m) {
            var obj = {}
            obj[m[1]] = m[2]
            return obj
        } else {
            return { raw: line }
        }
    }
}

module.exports = OneWire