/* Readable stream for DS18B20 sensors
*/

var Readable = require("stream").Readable
var inherits = require("util").inherits
var fs = require('fs')
var Promise = require("bluebird")
var _ = require("lodash")

var glob = Promise.promisify(require('glob'))
var readFile = Promise.promisify(fs.readFile)

function DS18B20Stream(eventType) {
    this.buf = []
    setInterval(this.poll.bind(this), 30*1000)
    this.poll()

    Readable.call(this, {objectMode: true})
}

inherits(DS18B20Stream, Readable)

DS18B20Stream.prototype.poll = function() {
  glob("/sys/bus/w1/devices/*/w1_slave")
  .then(function(files) {
    return Promise.map(files, function(file) {
      return readFile(file)
      .then(function(data) {
        return {
          id: file.split("/")[5],
          data: data.toString()
        }
      })
    })
  })
  .then(function(arr) {
    _.each(arr, function(obj) {
      var lines = obj.data.split("\n")
      delete obj.data
      if (lines[0].match(/YES$/)) {
        var temp = lines[1].match(/t=([0-9]+)$/)[1]
        obj.temperature = parseInt(temp) / 1000
        this.buf.push(obj)
        if (!this.writing) this.push(this.buf.shift());
      } else {
        console.error("CRC error", obj)
      }
    }.bind(this)) 
  }.bind(this))
}

DS18B20Stream.prototype._read = function (size) {
  if (this.writing) return;
  this.writing = true
  while (this.buf.length && size--) {
    if (this.push(this.buf.shift()) === false) break;
  }
  this.writing = false
}

module.exports = DS18B20Stream
