var stream = require('stream')
var util = require('util')

function CommandExtractor(config) {
    if (!(this instanceof CommandExtractor)) {
        return new CommandExtractor(options)
    }
    this.config = config || {}
    
    stream.Transform.call(this, {
        objectMode: true,
        highWaterMark: 16
    })
}

util.inherits(CommandExtractor, stream.Transform)
 
CommandExtractor.prototype._transform = function (chunk, encoding, done) {
    process.stdout.write(JSON.stringify(chunk))
    var house = this.config[chunk.house]
    if (house) {
        var cfg = house[chunk.unit]
        if (cfg) {
            console.log(cfg)
            this.push({ tdDevice: cfg[0], dimLevel: cfg[1], method: chunk.method })
        } else {
            console.log(" button not mapped")
        }
    } else {
        console.log(" house not mapped")
    }
    done()
}
 
module.exports = CommandExtractor