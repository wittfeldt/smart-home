
var tellsock = require("tellsock")
var EventEmitter = require('events').EventEmitter
var util = require("util")

function LocalTellstick() {
    tellsock.TelldusClient
    this._init()
}

LocalTellstick.prototype._init = function() {
    console.log("Connecting to local Tellstick")
    
    this.events = new require("tellsock").TelldusEvents()
    this.client = new require("tellsock").TelldusClient()
    
    // Reconnect
    this.events.on("end", function() {
        console.log("Disconnected")
        setTimeout(this._init.bind(this), 3000)
    }.bind(this))
}

module.exports = LocalTellstick