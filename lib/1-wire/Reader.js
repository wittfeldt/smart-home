/* Readable stream for 1-Wire sensors
*/

var Readable = require("stream").Readable
var inherits = require("util").inherits
var Promise = require("bluebird")
var fs = require('fs')
var _ = require("lodash")

var glob = Promise.promisify(require('glob'))
var readFile = Promise.promisify(fs.readFile)

var parsers = require("./payloadParsers")
var mixins = require("../mixins")
var extend = mixins.extend

function W1Reader(options) {
    this._setOptions(options, [ "path" ])
    Readable.call(this, { objectMode: true })
    this._start()
}

inherits(W1Reader, Readable)

extend(W1Reader.prototype, mixins.options)
extend(W1Reader.prototype, mixins.polling)

W1Reader.prototype._readSensors = function() {
    return Promise.map(
        glob(this.options.path), 
        this._readSensor.bind(this)
    )
    .filter(function(reading) { 
        return (reading != undefined)
    })
}

W1Reader.prototype._readSensor = function (path) {
    return readFile(path)
    .then(function(data) {
        return this._parse(path, data)
    }.bind(this))
}

W1Reader.prototype._parse = function(path, data) {
    var sensorInfo = this._parsePath(path)
    var lines = data.toString().split("\n")
    
    if (lines[0].match(/YES$/)) { // CRC
        return _.merge(
            { id: sensorInfo.id },
            sensorInfo.parser(lines[1])
        )
    }
}

W1Reader.prototype._parsePath = function(path) {
    var parts = path.split("/");
    var id = parts[parts.length-2]
    var family = id.split("-")[0]
    return {
        id: "1-wire/" + id,
        parser: parsers[parseInt(family)] || parsers.default
    }
}

module.exports = W1Reader