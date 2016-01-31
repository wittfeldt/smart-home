var _ = require("lodash")
var parsers = require("./parsers")

function Reading(path, data) {
    var parts = path.split("/");
    this.id = parts[parts.length-2]
    this.family = this.id.split("-")[0]
    this.lines = data.split("\n")
}

Reading.prototype.crc = function() {
    return this.lines[0].match(/YES$/) != null
}

Reading.prototype.toJSON = function() {
    var parser = parsers[this.family] ||  this.defaultParser
    return _.merge({ 
        id: "1-wire/" + this.id 
    }, parser(this.lines[1]))
}

Reading.prototype.defaultParser = function(line) {
    var m = line.match(/^.* ([^=]*)=(.*)$/)
    if (m) {
        var obj = {}
        obj[m[1]] = m[2]
        return obj
    } else {
        return { raw: line }
    }
}

module.exports = Reading