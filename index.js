#!/usr/bin/env node

var stdio = require('stdio')
var _ = require("lodash")

var Tellstick = require("./lib/Tellstick")
var OneWire = require("./lib/OneWire")
var Eliq = require("./lib/Eliq")
var Mqtt = require("./lib/Mqtt")

var Light = require("./lib/Light")
var dimCommands = Light.dimCommands
var dimExec = Light.dimExec
var upstream = require("./lib/Upstream")

var RemoteStream = require("./lib/RemoteStream")

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

// Light proxy
var dimCommands = dimCommands(tellstick, mqtt) // dim commands from mqtt and 433Mhz
dimExec(dimCommands, tellstick)                // execute commands via tellstick

// Iot upstream
var upstream = upstream(tellstick, oneWire, eliq, dimCommands)
mqtt.connect()
.then(upstream.pipe.bind(upstream, mqtt))