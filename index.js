#!/usr/bin/env node

var stdio = require('stdio')

var options = stdio.getopt({
	'thingName': {
		description: 'the thing name to publish as',
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
	'iotEndpoint': {
		description: 'AWS IoT endpoint',
		key: 'e',
		mandatory: true,
		args: 1
	},
	'eliqKey': {
		description: 'API key for Eliq online',
		args: 1
	},
	'pollInterval': {
		description: 'update interval for polling sources (sec)',
		key: 'i',
		default: 60,
		args: 1
	}
})