var stdio = require('stdio')
var mergeStream = require("merge-stream")
var TellsockStream = require("./lib/TellsockStream")
var DS18B20Reader = require("./lib/DS18B20Reader")
var Transforms = require("./lib/transforms")
var IotWriter = require("./lib/IotWriter")
var TelldusClient = require('tellsock').TelldusClient

var options = stdio.getopt({
	'thingName': {
		description: 'the thing name to publish as',
		key: 't',
		mandatory: true,
		args: 1
	},
	'create': {
		description: 'create the thing if it does not exist',
        key: "c",
		default: false,
		args: 1
	},
	'debug': {
		description: 'print debug output',
		key: 'd',
		default: false
	},
	'iamRole': {
		description: 'IAM role to assume',
        key: 'r',
		default: false,
		args: 1
	},
})

if (options.iamRole) {
    var AWS = require("./lib/aws")
    AWS.config.credentials = new AWS.TemporaryCredentials({
        RoleArn: options.iamRole
    })
    console.log("Assumed IAM role " + options.iamRole)
}

// Source stream
var tellsockEvents = new TellsockStream("raw")
var oneWire = new DS18B20Reader("/Users/andersw/1-wire-mock/*/w1_slave")
var events = mergeStream(tellsockEvents, oneWire)

// Transforms
var t = new Transforms({ highWaterMark: 16 })
var dimmer = t.dim(new TelldusClient())

// Sink
var iotWriter = new IotWriter(options)

events
.pipe(t.filter)          // extract and re-format relevant events
.pipe(dimmer)            // intercept and process dim commands
.pipe(t.merge)           // create composite payload
.pipe(iotWriter)         // publish