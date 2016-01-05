var Writable = require("stream").Writable
var inherits = require("util").inherits
var AWS = require("aws-sdk")
var _ = require("lodash")

function Publisher(thingName, create, callback) {
    Writable.call(this, { objectMode: true })
    this.iot = new AWS.Iot()
    
    return this.getIotData()
    .then(this.setupThing.bind(this, thingName, create))
    .then(callback.bind(null, this))
}

inherits(Publisher, Writable)

/* Get IotData endpoint address for current AWS account
*/

Publisher.prototype.getIotData = function() {
    return this.iot.describeEndpoint().promise()
    
    .then(function(res) {
        this.iotData = new AWS.IotData({
            endpoint: res.endpointAddress
        })
    }.bind(this))
}

/* Ensure that thing exists
*/

Publisher.prototype.setupThing = function(thingName, create) {
    this.thingName = thingName
    var params = {
        thingName: thingName
    }
    return this.iot.describeThing(params).promise()
    .catch(function(err) {
        if (err.statusCode != 404 || !create) {
            throw err
        } else {
            return this.createThing(params)
        }
    }.bind(this))
}

/* @override Stream.Writable._write
*/

Publisher.prototype._write = function (chunk, encoding, done) {
    if (!this.iotData) {
        done()
        return
    }
    
    var params = {
        topic: "$aws/things/" + this.thingName + "/shadow/update",
        payload: JSON.stringify({state: { reported: chunk }})
    }
    
    this.iotData.publish(params).promise()
    .then(function(res) {
        console.log(new Date(), this.thingName, JSON.stringify(chunk))
        done()
    }.bind(this))
    
    .catch(function(err) {
        console.log(new Date(), "error", err.stack)
        done(err.stack)
    })
}

module.exports = Publisher
