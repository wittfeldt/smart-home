var Writable = require("stream").Writable
var inherits = require("util").inherits
var actions = require("../config/actions")

function CommandExec(mqtt, tellstick) {
    this.mqtt = mqtt
    this.tellstick = tellstick
    Writable.call(this, { objectMode: true })
}

inherits(CommandExec, Writable)

CommandExec.prototype._write = function (obj, encoding, done) {
    console.log("CommandExec._write", JSON.stringify(obj))
    var fn = actions[obj.key]
    if (fn) {
        fn.call(null, this.tellstick, obj.id, obj.value)
        this._publish(obj)
    } else {
        console.log("CommandExec._write: no handler for " + key)
    }
    done()
}

CommandExec.prototype._publish = function(obj) {
    // Send executed state changes immediately (they're also part of 
    // the throttled publish stream)
    // Clear desired state if command originated from MQTT
    var reported = {}
    reported[ obj.id + "/" + obj.key ] = obj.value
    
    var message = { state: { reported: reported }}
    if (obj.origin == "mqtt") message.state.desired = null
    this.mqtt.write({ message: message })
}

module.exports = CommandExec