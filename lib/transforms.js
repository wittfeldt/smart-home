/* Stream modules for transforming tellstick events 
*/

var through2 = require("through2")
var _ = require("lodash")

function Transforms(opts) {
    opts.objectMode = true

    this.filter = through2.obj(function(obj, enc, done) {
        try {
            var path = ["./ng", obj["class"], obj.protocol, obj.model].join("/")
            var res = require(path).call(null, obj)
            if (res) this.push(res)
        } catch(err) {
            if (err.code != 'MODULE_NOT_FOUND') {
                console.error(err.stack)
            }
        }
        done()
    })

    this.dim = function(tellsockClient) {
        return through2.obj(function(obj, enc, done) {
            var dimLevel = obj.dimLevel
            if (dimLevel !== 'undefined') {
                dimLevel > 0 ?
                tellsockClient.tdDim(obj.id, dimLevel) :
                tellsockClient.tdTurnOff(obj.id)
        
            }
            this.push(obj)
            done()
        })
    }

    // Merge readings for all sensors into a composite payload by 
    // prefixing keys with sensor ID

    this.merge = through2.obj(function (obj, enc, done) {
        this.cache = this.cache || {}
        _.merge(this.cache, _.reduce(obj, function(memo, v, k) {
            if (k != "id") memo[obj.id + "/" + k] = v;
            return memo
        }, {}))
        this.push(this.cache)
        done()
    })
    
    // Snoop object stream

    this.snoop = function(label) {
        return through2(opts, function (chunk, enc, done) {
            console.log("#" + label + " " + new Date() + " - " + JSON.stringify(chunk))
            this.push(chunk)
            done()
        })
    }
}

module.exports = Transforms
