#!/usr/bin/env node

var AWS = require("./lib/aws")
AWS.config.credentials = new AWS.TemporaryCredentials({
    RoleArn: 'arn:aws:iam::683440172240:role/tcxn'
})

var TellstickStream = require("./lib/tellstick-stream")
var Transforms = require("./lib/transforms")
var Publisher = require("./lib/publisher")

var stdio = require('stdio');

var options = stdio.getopt({
	'thingName': {
		description: 'the thing name to publish as',
		key: 't',
        mandatory: true,
		args: 1
	},
	'create': {
		description: 'create the thing if it does not exist',
        default: false,
		args: 1
	},
	'debug': {
		description: 'print debug output',
        key: 'd',
        default: false
	}
})

var t = new Transforms({ 
    highWaterMark: 16
})

var filter = t.select([ "id", "temperature", "humidity" ], true)
var throttle59 = t.throttle(59*1000, "id")

new Publisher(options.thingName, options.create, function(publish) {
    new TellstickStream("sensor")
    .pipe(filter)     // skip irrelevant events and filter payload
    .pipe(throttle59) // throttle readings for each sensor to ~ 1/60hz
    .pipe(t.merge)    // merge readings for all sensors
    .pipe(publish)    // publish to AWS IoT
})