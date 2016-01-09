/* Readable stream for 1-wire sensors
*/

var Readable = require("stream").Readable
var inherits = require("util").inherits
var fs = require('fs')
var Promise = require("bluebird")
var _ = require("lodash")

var glob = Promise.promisify(require('glob'))
var readFile = Promise.promisify(fs.readFile)

function DS18B20Reader(glob) {
    this.glob = glob || "/sys/bus/w1/devices/*/w1_slave"
    this.buf = []
    setInterval(this.poll.bind(this), 30*1000)
    this.poll()

    Readable.call(this, {objectMode: true})
}

inherits(1WireReader, Readable)

1WireReader.prototype.poll = function() {
    this.readFiles(this.glob)
    .then(function(arr) {
        _.each(arr, function(obj) {
            this.buf.push(obj)
            if (!this.writing) this.push(this.buf.shift());
        }.bind(this)) 
    }.bind(this))
}

1WireReader.prototype.readFiles(glob) {
    return glob(glob)
    .then(function(fileNames) {
        return Promise.map(fileNames, function(fileName) {
            return readFile(fileName)
            .then(this.toEvent.bind(this, fileFilename))
        })
    })
}

1WireReader.prototype.toEvent(fileName, data) {
    var obj = {
        id: fileName.split("/")[5],
        data: data.toString(),
        protocol: "1wire",
        model: "temperature"
    }
    obj["class"] = "sensor" // reserved word
    return obj
}

1WireReader.prototype._read = function (size) {
    if (this.writing) return;
    this.writing = true
    while (this.buf.length && size--) {
        if (this.push(this.buf.shift()) === false) break;
    }
    this.writing = false
}

module.exports = 1WireReader
