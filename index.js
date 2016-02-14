#!/usr/bin/env node

var stdio = require('stdio')
var through2 = require("through2")
var mergeStream = require("merge-stream")
var _ = require("lodash")

var Tellstick = require("./lib/Tellstick")
var OneWire = require("./lib/OneWire")
var Eliq = require("./lib/Eliq")
var Mqtt = require("./lib/Mqtt")

var dimmerEvents = Tellstick.dimmerEvents
var sensorEvents = Tellstick.sensorEvents
var CommandExec = require("./lib/CommandExec")

var Transforms = require("./lib/Transforms")
var t = new Transforms({ highWatermark: 16 })

var options = stdio.getopt({
	'clientId': {
		description: 'IoT thing / MQTT client ID',
		key: 't',
		mandatory: true,
		args: 1
	},
	'certDir': {
		description: 'certificate directory',
		key: 'd',
		mandatory: true,
		args: 1
	},
	'host': {
		description: 'MQTT broker hostname',
		key: 'h',
		mandatory: true,
		args: 1
	},
    'eliqKey': {
        description: 'API key for Eliq online',
        key: 'e',
        args: 1
    }
})

var tellstick = new Tellstick()
var oneWire = new OneWire()
var eliq = new Eliq({ apiKey: options.eliqKey })
var mqtt = new Mqtt(_.pick(options, [ "certDir", "clientId", "host"]))

var sshOpts = {
    host: "192.168.1.161", 
    username: "pi",
    privateKey: require('fs').readFileSync('/Users/andersw/.ssh/id_rsa')
}
var RemoteStream = require("./lib/RemoteStream")
tellstick = new RemoteStream("./lib/Tellstick", sshOpts)
oneWire = new RemoteStream("./lib/OneWire", sshOpts)

var commandStream = mergeStream(dimmerEvents(tellstick), mqtt.deltaEvents())
var publishStream = mergeStream(commandStream, sensorEvents(tellstick), oneWire, eliq)

mqtt.init()
.then(function(mqtt) {
    
    // Publish observations
    publishStream
    .pipe(t.dimReplay())          // Replay last dim state for nicer graphs
    .pipe(t.idMapper())           // Use human-friendly id for known sensors
    .pipe(t.prefixResources())    // { id: 1, foo: 2} => { 1/foo: 2 }
    .pipe(t.throttle(60 * 1000))  // Limit publish to 1/60Hz
    .pipe(mqtt)
    
    // Process incoming commands
    commandStream
    .pipe(new CommandExec(publishStream, tellstick))
})
.catch(function(err) {
    console.log(err.stack)
})
