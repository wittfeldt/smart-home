var EventEmitter = require("events").EventEmitter
var inherits = require("util").inherits
var exec = require("child_process").exec
var _ = require("lodash")

var cache = {}

function RemoteTellstick(host) {
    if (cache[host]) return cache[host];
    
    this.host = host
    this.events = new EventEmitter()
    this.client = this._initClient()
    this._conn = this._connect()
    
    cache[host] = this
}

/* Implement all methods defined by TelldusClient
*/

RemoteTellstick.prototype._initClient = function() {
    var self = this
    var tc = require("tellsock").TelldusClient
    return _.reduce(_.keys(tc.prototype), function(memo, fn) {
        memo[fn] = function() { self._sendCommand([ fn ].concat(arguments)) }
        return memo
    }.bind(this))
}

RemoteTellstick.prototype._sendCommand = function(payload) {
    this.conn.stdin.write(JSON.stringify(payload) + "\n")
}

RemoteTellstick.prototype._connect = function() {
    console.log("Connecting to remote tellstick on " + this.host)
    
    var conn = exec("ssh " + this.host + " -C \"cd ~/smart-home && node -e '" + 
    // " setTimeout(function() { process.exit(); }, 10*1000);" + 
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
    
    var self = this
    
    // Reconnect handler
    conn.stdout.on("end", function() {
        console.log("Disconnected")
        setTimeout(self._connect.bind(self), 3000)
    })
    
    conn.stdout.on("data", function(data) {
        data.split("\n").forEach(function(line) {
            if (line.length > 0) self.events.emit("event", JSON.parse(line));
        })
    })
    return conn
}

module.exports = RemoteTellstick