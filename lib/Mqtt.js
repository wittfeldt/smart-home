/* Duplex stream for Mqtt
*/

var Duplex = require("stream").Duplex
var inherits = require("util").inherits
var mqtt = require("mqtt")
var readFile = require("fs").readFileSync
var join = require("path").join
var _ = require("lodash")
var through2 = require("through2")

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
    var meta = obj.pubStreamMeta
    if (meta) delete obj.pubStreamMeta;
    if (!obj.message) obj = { message: { state: { reported: obj }}};
    if (meta && meta.clearDesired) obj.message.state.desired = null;
        
    console.log("Mqtt._write", JSON.stringify(obj))
    obj.topic = obj.topic || this.shadowTopic("/update")
    this.client.publish(obj.topic, JSON.stringify(obj.message))
    done()
}

Mqtt.prototype.checkOptions = function(opts, required) {
    _.each(required, function(key) {
        if (typeof opts[key] === "undefined")
            throw new Error(key + " is required");
    })
    return opts
}

Mqtt.prototype.init = function() {
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

console.log(mqttOpts)
                
    return new Promise(function(resolve, reject) {
        var client = self.client = mqtt.connect(mqttOpts)
        
        client.on("connect", function() { 
            console.log("MQTT connect")
            self.client.subscribe(self.shadowTopic("/update/delta"))
            
            client.on("message", function(topic, message) {
                self.push({
                    topic: topic,
                    message: JSON.parse(message.toString())
                })
            })
            resolve(self)
        })
        client.on("error", function(err) { console.log("Mqtt error", err) })
    })
}

Mqtt.prototype.subscribe = function(topic) {
    this.client.subscribe(topic)
}

Mqtt.prototype.shadowTopic = function(suffix) {
    return "$aws/things/" + this.options.clientId + "/shadow" + suffix
}

Mqtt.prototype.deltaEvents = function() {
    return this.pipe(through2.obj(function(obj, enc, done) {
        var self = this
        
        if (obj.topic.match(/delta$/) && obj.message.state) {
            console.log("got delta", JSON.stringify(obj))
            _.each(obj.message.state, function(v, k) {
                var keyParts = k.split("/")
                var ev = {
                    id: keyParts[0],
                    key: keyParts[1],
                    value: v,
                    origin: "mqtt"
                }
                self.push(ev)
            })
        }
        done()
    }))
}

module.exports = Mqtt
