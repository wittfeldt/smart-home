/* Stream transform modules
*/

var through2 = require("through2")
var _ = require("lodash")

function Transforms(opts) {
    opts.objectMode = true
    
    // Replace id with human-friendly name for known sensors

    this.idMapper = function() {
        var idMap = require("../config/sensors.js")
        return through2(opts, function (obj, enc, done) {
            if (obj.id && idMap[obj.id]) {
                obj.id = idMap[obj.id]
            }
            this.push(obj)
            done()
        })
    }
    
    // Prefix keys with idField and remove idField

    this.prefixResources = function() {
        return through2(opts, function (chunk, enc, done) {
            var prefixed = _.reduce(chunk, function(memo, v, k) {
                if (k == "pubStreamMeta") {
                    memo[k] = v
                } else if (k != "id") {
                    memo[chunk.id + "/" + k] = v
                }
                return memo
            }, {})
            this.push(prefixed)
            done()
        })
    }
    
    // Throttle events to given interval
    // This transform retains values received between each push

    this.throttle = function(ms) {
        return through2(opts, function (obj, enc, done) {
            this.db = this.db || { pl: {}, ts: null}
            var now = Date.now()
            
            var meta = obj.pubStreamMeta
            if (meta && meta.force) {
                this.push(obj)
                delete obj.pubStreamMeta
            }
            
            _.merge(this.db.pl, obj)
            
            if (this.db.ts && now - this.db.ts < ms) {
                // Suppress
            } else {
                this.push(this.db.pl)
                this.db.pl = {}
                this.db.ts = now
            }
            done()
        })
    }
    
    // Replay events on interval for nicer graphs
    
    var replay = function(intervalMs, filterFn) {
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
        }, intervalMs)
        return tf
    }
    
    this.replay = replay
    
    this.dimReplay = function() {
        return replay(10 * 60 * 1000, function(obj) {
            return (typeof obj.dimLevel != 'undefined')
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