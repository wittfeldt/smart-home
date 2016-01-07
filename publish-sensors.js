#!/usr/bin/env node

var AWS = require("./lib/aws")
AWS.config.credentials = new AWS.TemporaryCredentials({
    RoleArn: 'arn:aws:iam::683440172240:role/tcxn'
})

var TellstickStream = require("./lib/tellstick-stream")
var DS18B20Stream = require("./lib/DS18B20Stream")
var Transforms = require("./lib/transforms")
var Publisher = require("./lib/publisher")

var mergeStream = require("merge-stream")

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

var filter = t.filter({ id: /[0-9]+/ }, function(chunk) {
	return (chunk.temperature || chunk.humidity)
})
var select = t.select(["id", "temperature", "humidity"])
var throttle59 = t.throttle(59*1000)

new Publisher(options.thingName, options.create, function(publish) {
	mergeStream(new TellstickStream("sensor"), new DS18B20Stream())
        .pipe(select)     // select fields
	.pipe(filter)     // skip irrelevant events
	.pipe(t.merge)    // merge readings for all sensors
	.pipe(throttle59) // throttle to ~ 1/60hz
	.pipe(publish)    // publish to AWS IoT
})
