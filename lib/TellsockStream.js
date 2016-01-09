/* Stream interface to a local or remote tellstick
*/

var stream = require('stream');
var util = require('util');
var Duplex = stream.Duplex

var tellsock = require("tellsock")
var TelldusEvents = tellsock.TelldusEvents
var TelldusClient = tellsock.TelldusClient
var exec = require('child_process').exec

// Remote streams cache
var remotes = {}

function TellstickStream(host) {
    this.buf = []
    this.setup(host)
    Duplex.call(this, { objectMode: true })
}
util.inherits(TellstickStream, Duplex)

TellstickStream.prototype.setup = function (host) {
    if (host) {
        this.initRemote(host)
    } else {
        this.events = new TelldusEvents()
        this.client = new TelldusClient()
    }
    this.events.on("raw", function(pl) {
        this.buf.push(pl)
        if (!this.writing) this.push(this.buf.shift())
    }.bind(this))
}   

TellstickStream.prototype._read = function (size) {
    if (this.writing) return;
    this.writing = true
    while (this.buf.length && size--) {
        if (this.push(this.buf.shift()) === false) break;
    }
    this.writing = false
}

TellstickStream.prototype._write = function (arr, enc, done) {
    if (this.remote) {
        this.remote.stdin.write(JSON.stringify(arr))
    } else {
        this.client[arr.splice(0,1)].apply(this.client, arr)
    }    
    done()
}

TellstickStream.prototype.initRemote = function(host) {
    if (remotes[host]) return remotes[host]
        
    var child = exec("ssh " + host + " -C \"cd ~/smart-home && node -e '" + 
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

    // Handle disconnect
    child.stdout.on("end", function() {
        console.log("TellsockRemote disconnected")
        setTimeout(function() {
            delete remotes[host]
            this.setup(host)
        }.bind(this), 1500)
    }.bind(this))
    
    // Mimic TelldusEvents by emitting raw events with parsed data
    child.stdout.on("data", function(data) {
        data.split("\n").forEach(function(line) {
            try {
                if (line.length > 0) child.stdout.emit("raw", JSON.parse(line))
            } catch(err) {
                console.error("JSON Parse error", line)
                console.log(err.stack)
            }
        })
    })

    console.log("TellsockRemote connected to " + host)
    this.remote = remotes[host] = child
    this.events = this.remote.stdout
}

module.exports = TellstickStream

