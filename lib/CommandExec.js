var Writable = require("stream").Writable
var inherits = require("util").inherits
var actions = require("../config/actions")

function CommandExec(publishStream, tellstick) {
    this.publishStream = publishStream
    this.tellstick = tellstick
    Writable.call(this, { objectMode: true })
}

inherits(CommandExec, Writable)

CommandExec.prototype._write = function (obj, encoding, done) {
    var fn = actions[obj.key]
    if (fn) {
        console.log("CommandExec: " + 
            obj.id + "/" + obj.key + " set to " + 
            obj.value + " on behalf of " + obj.origin)
        
        fn.call(null, this.tellstick, obj.id, obj.value)
        this._publish(obj)
    } else {
        console.log("CommandExec: no handler for " + key)
    }
    done()
}

CommandExec.prototype._publish = function(obj) {
    var ev = {
        id: obj.id,
        pubStreamMeta: {
            force: true,
            clearDesired: (obj.origin == "mqtt")
        }
    }
    ev[obj.key] = obj.value
    this.publishStream.write(ev)
}

module.exports = CommandExec