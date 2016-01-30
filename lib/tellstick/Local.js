/*
var tellsock = require("tellsock")
var EventEmitter = require('events').EventEmitter
var util = require("util")

function LocalTellstick() {
    tellsock.TelldusClient
    this._init()
}

util.inherits(LocalTellstick, tellsock.TelldusClient)
util.extend(EventEmitter.prototype)

LocalTellstick.prototype._init = function() {
    console.log("Tellstick connecting")
    
    this.events = new require("tellsock").TelldusEvents()
    this.client = new require("tellsock").TelldusClient()
    
    // Reconnect
    this.events.on("end", function() {
        setTimeout(this._init.bind(this), 3000)
    }.bind(this))
}

module.exports = LocalTellstick

*/