var inherits = require("util").inherits
var _1WireReader = require("./Reader")

function DS18B20Reader(path) {
    DS18B20Reader.call(this, path)
}

inherits(DS18B20, _1WireReader)

DS18B20.prototype._format = function(data) {
    var lines = data.split("\n")
    if (lines[0].match(/YES$/)) {
        var match = lines[1].match(/t=([0-9]+)$/)
        var str = match[1]
        if (str && !isNaN(str)) {
            return {
                temperature: parseInt(str) / 1000
            }
        } else {
            console.error("1-wire parse error", lines[1])
        }
    } else {
        console.error("1-wire CRC error", lines[0])
    }
}

module.exports = DS18B20