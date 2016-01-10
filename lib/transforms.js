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
    
    // Throttle events
    // Pass idField to group events based on a common field and 
    // use a separate timer for each group

    this.throttle = function(ms, idField) {
        return through2(opts, function (chunk, enc, done) {
            this.db = this.db || {}
            
            var id = idField ? chunk[idField] : "_",
                last = this.db[id]
                now = Date.now()
            
            if (last && now - last < ms) {
                // Supress
            } else {
                this.db[id] = now
                this.push(chunk)
            }
            done()
        })
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
