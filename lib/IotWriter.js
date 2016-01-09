/* Writable stream for AWS IoT
*/

var Writable = require("stream").Writable
var inherits = require("util").inherits
var AWS = require("./aws")
var _ = require("lodash")

function IotWriter(options) {
    this.options = options || {}
    Writable.call(this, { objectMode: true })
    
    this.initIotData()
    .then(this.initThing.bind(this, options.thingName, options.create)) 
}

inherits(IotWriter, Writable)

/* Get IotData endpoint address for current AWS account
*/

IotWriter.prototype.initIotData = function() {
    var iot = new AWS.Iot()
    return iot.describeEndpoint().promise()
    .then(function(res) {
        console.log("Iot endpoint:" + res.endpointAddress)
        this.iotData = new AWS.IotData({
            endpoint: res.endpointAddress
        })
    }.bind(this))
}

/* Ensure that thing exists
*/

IotWriter.prototype.initThing = function(thingName, create) {
    console.log("Thing name: " + thingName)
    this.thingName = thingName
    var params = {
        thingName: thingName
    }
    var iot = new AWS.Iot()
    return iot.describeThing(params).promise()
    .catch(function(err) {
        if (err.statusCode == 404 && create) {
            console.log("Thing was not found, creating")
            return this.createThing(params)
        }
        console.error(err.message)
        process.exit(255)
    }.bind(this))
}

/* @override Stream.Writable._write
*/

IotWriter.prototype._write = function (chunk, encoding, done) {
    if (!this.iotData) { done(); return }
    
    var params = {
        topic: "$aws/things/" + this.thingName + "/shadow/update",
        payload: JSON.stringify({state: { reported: chunk }})
    }
    
    var self = this
    this.iotData.publish(params).promise()
    .then(function(res) {
        console.log(new Date(), JSON.stringify(chunk))
        done()
    })
    .catch(function(err) {
        console.error("IotData.publish", err)
        self.iotData = null
        setTimeout(self.initIotData.bind(self), 3000)
    })
}

module.exports = IotWriter