/* Duplex stream for Tellstick (Duo)
*/

var Duplex = require("stream").Duplex
var inherits = require("util").inherits
var tellsock = require("tellsock")
var through2 = require("through2")

function Tellstick() {
    this._init()

    Duplex.call(this, { objectMode: true })
}

inherits(Tellstick, Duplex)

Tellstick.prototype._init = function() {
    this.events = new tellsock.TelldusEvents()
    this.client = new tellsock.TelldusClient()
    
    this.events.on("raw", this.push.bind(this))
    
    this.events.on("end", function() {
        console.log("Reconnecting")
        setTimeout(this._init.bind(this), 3000)
    }.bind(this))
}

Tellstick.prototype._read = function (size) {
}

// [ command, deviceId, arg1, ... ]
Tellstick.prototype._write = function (arr, enc, done) {
    this.client[arr.splice(0,1)].apply(this.client, arr)
    done()
}

Tellstick.dimmerEvents = function(source) {
    
    /* Events from selflearning remotes come in the form of house, unit, method
     * Map them to id, dimLevel events using the remotes.js config */
    
    var buttonMap = require("../config/remotes")
    
    return source.pipe(through2.obj(function(obj, enc, done) {
        var house = buttonMap[obj.house] || {}
        var tuple = house[obj.unit]
        if (tuple) {
            this.push({ 
                id: "light" + tuple[0],
                key: "dimLevel",
                value: (obj.method == 'turnoff') ? 0 : tuple[1],
                origin: [ "433mhz", obj.house, obj.unit ].join(":")
            })
        }
        done()
    }))
}

Tellstick.sensorEvents = function(source) {
    return source.pipe(through2.obj(function(obj, enc, done) {
        if (obj.temp || obj.humidity) {
            var ev = { id: "rf" + obj.id }
            if (obj.temp) ev.temperature = parseFloat(obj.temp);
            if (obj.humidity) ev.humidity = parseFloat(obj.humidity);
            this.push(ev)
        }
        done()
    }))
}

module.exports = Tellstick