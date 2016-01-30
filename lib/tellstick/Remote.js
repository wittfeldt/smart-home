var EventEmitter = require("events").EventEmitter
var inherits = require("util").inherits
var exec = require("child_process").exec

var remotes = {}

function RemoteTellstick(host) {
    if (remotes[host]) return remotes[host];
    
    EventEmitter.call(this)
    this.host = host
    remotes[host] = this._init()
}

inherits(RemoteTellstick, EventEmitter)

RemoteTellstick.prototype._init = function(host) {
    this._conn = this._connect()
    this._bindEvents()
    this._buildCommands()
    return this
}

RemoteTellstick.prototype._buildCommands = function() {
    var self = this;
    [ "tdTurnOn", "tdTurnOff", "tdDim" ].forEach(function(fn) {
        this[fn] = function() { self._send([ fn ].concat(arguments)) }
    }.bind(this))
}

RemoteTellstick.prototype._send = function(conn, payload) {
    conn.stdin.write(JSON.stringify(payload) + "\n")
}

RemoteTellstick.prototype._connect = function() {
    console.log("Connecting to remote tellstick on " + this.host)
    
    return exec("ssh " + this.host + " -C \"cd ~/smart-home && node -e '" + 
    " setTimeout(function() { process.exit(); }, 10*1000);" + 
    " var tellsock = require(\\\"tellsock\\\");" + 
    " (new tellsock.TelldusEvents()).on(\\\"raw\\\", " + 
    "  function(ev) { " +
    "    console.log(JSON.stringify(ev)) " + 
    "  });" +
    " var tc = new tellsock.TelldusClient();" +
    " process.stdin.on(\\\"data\\\", " + 
    "   function(data) { " + 
    "     var arr = JSON.parse(data);" + 
    "     tc[arr.splice(0,1)].apply(tc, arr) " + 
    " });" + 
    "'\"")
}

RemoteTellstick.prototype._bindEvents = function() {
    var self = this
    
    // Reconnect
    this._conn.stdout.on("end", function() {
        setTimeout(function() {
            delete remotes[self.host]; self._init()
        }, 1500)
    })
    
    // Mimic TelldusEvents by emitting raw events with parsed data
    this._conn.stdout.on("data", function(data) {
        data.split("\n").forEach(function(line) {
            if (line.length > 0) self.emit("event", JSON.parse(line));
        })
    })
}

module.exports = RemoteTellstick