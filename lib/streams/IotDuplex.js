/* Duplex stream for AWS IoT
*/

var Writable = require("stream").Duplex
var inherits = require("util").inherits
var AWS = require("../aws")
var _ = require("lodash")

function IotDuplex(options) {
    Duplex.call(this, { objectMode: true })
}

inherits(IotDuplex, Duplex)

module.exports = IotDuplex