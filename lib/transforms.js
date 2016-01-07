/* Stream modules for transforming tellstick events 
*/

var through2 = require("through2")
var _ = require("lodash")

function Transforms(opts) {
    opts.objectMode = true

    // Select fields from event, pass required = true
    // to filter out events that does not contain values for
    // all of them
    
    this.select = function(fields, required) {
        return through2(opts, function (chunk, enc, done) {
            var res = _.reduce(fields, function(memo, k) {
                if (chunk[k]) memo[k] = chunk[k]
                return memo
            }, {})
            if (required && _.keys(res).length != fields.length) {
                // Suppress
            } else {
                this.push(res)
            }
            done()
        })
    }
    
    this.filter = function(conditions, fn) {
        fn = (typeof fn === 'function') ? fn : function() { return true }
        return through2(opts, function (chunk, enc, done) {
            var allMatch = true
            _.each(conditions, function(v,k) {
              if (!chunk[k] || !chunk[k].toString().match(v)) {
                allMatch = false
                return false
              }
            })
            if (allMatch && fn.call(null, chunk)) this.push(chunk);
            done()
        })
    }
    
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
    
    // Merge readings for all sensors into a composite payload by 
    // prefixing them with sensor ID
    
    this.merge = through2(opts, function (chunk, enc, done) {
        this.cache = this.cache || {}
        _.merge(this.cache, _.reduce(chunk, function(memo, v, k) {
            if (k != "id")
                memo[chunk.id + "/" + k] = parseFloat(v);
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
