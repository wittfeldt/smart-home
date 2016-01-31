var stdio = require('stdio')
var mergeStream = require("merge-stream")
var TellsockStream = require("./lib/tellstick/Stream")
var _1WireReader = require("./lib/1-wire/Reader")
var Transforms = require("./lib/transforms")
var IotWriter = require("./lib/IotWriter")
var TelldusClient = require('tellsock').TelldusClient
var EliqStream = require("./lib/EliqStream")

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
	'eliqKey': {
		description: 'API key for Eliq online',
		args: 1
	}
})

if (options.iamRole) {
    var AWS = require("./lib/aws")
    AWS.config.credentials = new AWS.TemporaryCredentials({
        RoleArn: options.iamRole
    })
    console.log("Assumed IAM role " + options.iamRole)
}

var ts = new TellsockStream("pi@192.168.1.161")
var ts2 = new TellsockStream("pi@192.168.1.161")
var t = new Transforms({ highWaterMark: 16 })

ts.pipe(t.snoop("raw"))
ts2.pipe(t.snoop("raw2"))

/*

// Source streams

var events = mergeStream()
events.add(new TellsockStream("raw"))
events.add(new DS18B20Reader())

if (options.eliqKey) {
    events.add(new EliqStream(options.eliqKey))
}

// For testing
// var TellsockStreamRemote = require("./lib/TellsockStreamRemote")
// var events = new TellsockStreamRemote("pi@192.168.1.161")

// Transforms
var t = new Transforms({ highWaterMark: 16 })
var dimExec = t.dim(new TelldusClient())
var dimReplay = t.replay(30 * 60, function(obj) {
    return (typeof obj.dimLevel != 'undefined')
})

// Sink
var iotWriter = new IotWriter(options)

events
.pipe(t.filter)            // extract and re-format relevant events
.pipe(dimExec)             // intercept and process dim commands
.pipe(dimReplay)           // emit last dim command once in a while for nicer graphs
.pipe(t.prefix("id"))      // create composite payload
.pipe(t.throttle(59*1000)) // limit to ~ 1/60 Hz
.pipe(iotWriter)           // publish to AWS IoT

*/
