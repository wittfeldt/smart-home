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
var oneWire = new DS18B20Reader()
var events = mergeStream(tellsockEvents, oneWire)

// For testing
var TellsockStreamRemote = require("./lib/TellsockStreamRemote")
var events = new TellsockStreamRemote("pi@192.168.1.161")

// Transforms
var t = new Transforms({ highWaterMark: 16 })
var dimmer = t.dim(new TelldusClient())
var dimReplay = t.replay(30 * 60, function(obj) {
    return (typeof obj.dimLevel != 'undefined')
})

// Sink
var iotWriter = new IotWriter(options)

events
.pipe(t.filter)            // extract and re-format relevant events
.pipe(dimmer)              // intercept and process dim commands
.pipe(dimReplay)           // emit last dim command once in a while for nicer graphs
.pipe(t.prefix("id"))      // create composite payload
.pipe(t.throttle(59*1000)) // limit to ~ 1/60 Hz
.pipe(iotWriter)           // publish to AWS IoT
