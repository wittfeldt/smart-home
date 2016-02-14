/* Duplex stream for Mqtt
*/

var Duplex = require("stream").Duplex
var inherits = require("util").inherits
var mqtt = require("mqtt")
var readFile = require("fs").readFileSync
var join = require("path").join
var _ = require("lodash")

var checkOptions = require("./Util").checkOptions

function Mqtt(options) {
    this.options = checkOptions(options, [
        "host", 
        "certDir", 
        "clientId"
    ])
    
    Duplex.call(this, { objectMode: true })
}

inherits(Mqtt, Duplex)

Mqtt.prototype._read = function (size) {
}

Mqtt.prototype._write = function (obj, enc, done) {
    console.log("Mqtt send", JSON.stringify(obj))
    this.client.publish(this.baseTopic() + "/update", JSON.stringify({
        state: { reported: obj }
    }))
    done()
}

Mqtt.prototype.checkOptions = function(opts, required) {
    _.each(required, function(key) {
        if (typeof opts[key] === "undefined")
            throw new Error(key + " is required");
    })
    return opts
}

Mqtt.prototype.connect = function() {
    var options = this.options
    var self = this
    
    var mqttOpts = {
        ca: readFile(join(__dirname, "../config/rootCA.pem")),
        port: 8883,
        protocol: 'mqtts',
        hostname: options.host,
        cert: readFile(join(options.certDir, "cert.pem")),
        key: readFile(join(options.certDir, "privkey.pem")),
        clientId: options.clientId
    }
                
    return new Promise(function(resolve, reject) {
        var client = self.client = mqtt.connect(mqttOpts)
        
        client.on("connect", function() { 
            console.log("MQTT connect")
            client.subscribe(self.baseTopic() + "/update/delta")
            
            client.on("message", function(topic, message) {
                message = JSON.parse(message.toString())
                if (message.state) {
                    // Acknowledge set operation
                    client.publish(self.baseTopic() + "/update", 
                        JSON.stringify({ state: { desired: null }}))
                    // Emit observation
                    self.push(message.state)
                }
            })
            resolve()
        })
    })
}

Mqtt.prototype.baseTopic = function() {
    return "$aws/things/" + this.options.clientId + "/shadow"
}

module.exports = Mqtt