/* Keeping the right buttons on your remote paired with the right 
 * receivers can be a PITA, especially when using in-wall mounted stuff
 * This server allows you to decouple the remotes from the receivers
 * by using a Tellstick as a mapping proxy
 * 
 * So basically, instead of pairing the remotes directly with the 
 * receivers, you pair them with your Tellstick and define the mappings 
 * in software (remotes.js)
*/

var TellstickStream = require("./lib/tellstick-stream")
var Transforms = require("./lib/transforms")
var stdio = require('stdio')
var CommandExtractor = require("./lib/command-extractor")
var CommandEmitter = require("./lib/command-emitter")

var options = stdio.getopt({
	'config-file': {
		description: 'path to configuration file',
        key: 'f',
        default: "./remotes.js",
        args: 1
	}
})

var t = new Transforms({ 
    highWaterMark: 16,
})

var remoteConfig = require(options["config-file"])
var filter = t.filter({ "class": "command", "protocol": "arctech" })
var select = t.select(["house", "unit", "method"], true)
var extractCommand = new CommandExtractor(remoteConfig)
var emitCommand = new CommandEmitter()

new TellstickStream("raw")
.pipe(filter)
.pipe(select)
.pipe(extractCommand)
.pipe(t.throttle(1000))
.pipe(emitCommand)





