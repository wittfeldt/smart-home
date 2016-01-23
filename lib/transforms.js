/* Stream transform modules
*/

var through2 = require("through2")
var _ = require("lodash")

function Transforms(opts) {
    opts.objectMode = true
    
    // Locate and run filter plugin based on class, proto and model, silently skip 
    // event if not found

    this.filter = through2.obj(function(obj, enc, done) {
        try {
            // Attempt to load filter plugin based on class, proto and model
            var path = ["./plugins", obj["class"], obj.protocol, obj.model].join("/")
            var res = require(path).call(null, obj)
            if (res) this.push(res)
        } catch(err) {
            if (err.code != 'MODULE_NOT_FOUND') console.error(err.stack);
        }
        done()
    })
    
    // Intercept and process dim commands

    this.dim = function(tellsockClient) {
        return through2.obj(function(obj, enc, done) {
            var dimLevel = obj.dimLevel
            if (typeof dimLevel !== 'undefined') {
                switch(dimLevel) {
                case 0:
                    tellsockClient.tdTurnOff(obj.id)
                    break
                case 255:
                    tellsockClient.tdTurnOn(obj.id)
                    break
                default:
                    tellsockClient.tdDim(obj.id, dimLevel)
                }
            }
            this.push(obj)
            done()
        })
    }
    
    // Prefix keys with idField and remove idField

    this.prefix = function(idField) {
        return through2(opts, function (chunk, enc, done) {
            var prefixed = _.reduce(chunk, function(memo, v, k) {
                if (k != idField) memo[chunk[idField] + "/" + k] = v;
                return memo
            }, {})
            this.push(prefixed)
            done()
        })
    }
    
    // Throttle events to given interval
    // This transform retains values received between each push

    this.throttle = function(ms) {
        return through2(opts, function (chunk, enc, done) {
            this.db = this.db || { pl: {}, ts: null}
            var now = Date.now()
            _.merge(this.db.pl, chunk)
            
            if (this.db.ts && now - this.db.ts < ms) {
                // Supress
            } else {
                this.push(this.db.pl)
                this.db.pl = {}
                this.db.ts = now
            }
            done()
        })
    }
    
    // Replay events on interval for nicer graphs
    
    this.replay = function(intervalSec, filterFn) {
        var state = {}
        var tf = through2.obj(function(obj, enc, done) {
            if (filterFn(obj)) state[obj.id] = obj;
            this.push(obj)
            done()
        })
        setInterval(function() {
            _.each(state, function(obj) {
                tf.push(obj)
            })
        }, intervalSec * 1000)
        return tf
    }
    
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
