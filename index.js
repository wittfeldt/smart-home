var TellsockStream = require("./ng/TellsockStream")
var DS18B20Reader = require("./ng/DS18B20Reader")
var Transforms = require("./lib/transforms")
var TelldusClient = require('tellsock').TelldusClient

// Input streams
var tellsockEvents = new TellsockStream("pi@192.168.1.161")
var inputs = mergeStream(tellsockEvents, new 1WireReader())

// Transforms
var t = new Transforms({ highWaterMark: 16 })
var dimmer = t.dim(new TelldusClient())

// Sink

inputs
.pipe(t.filter)       // extract and re-format relevant events
.pipe(dimmer)         // intercept and process dim commands
.pipe(t.merge)        // create composite payload
// .pipe(publish)     // publish to AWS IoT

.pipe(through2.obj(function (chunk, enc, done) {
    console.log(new Date() + " - " + JSON.stringify(chunk))
    done()
}))