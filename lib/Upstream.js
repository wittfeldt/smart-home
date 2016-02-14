var mergeStream = require("merge-stream")
var through2 = require("through2")
var _ = require("lodash")

var Transforms = require("./Transforms")
var t = new Transforms({ highWatermark: 16 })

module.exports = function(tellstick, oneWire, eliq, dimCommands) {
    
    var _433Sensors = tellstick.pipe(through2.obj(function(obj, enc, done) {
        if (obj.temp || obj.humidity) {
            var ev = { id: "rf" + obj.id }
            if (obj.temp) ev.temperature = parseFloat(obj.temp);
            if (obj.humidity) ev.humidity = parseFloat(obj.humidity);
            this.push(ev)
        }
        done()
    }))

    var dimReplay = t.replay(10 * 60 * 1000, function(obj) {
        return (typeof obj.dimLevel != 'undefined')
    })

    var events = mergeStream()    // Merged stream of all sensor and dim events
    events.add(_433Sensors)
    events.add(oneWire)
    events.add(eliq)
    events.add(dimCommands)
    
    return events                     
    .pipe(dimReplay)              // Replay last dim state for nicer graphs
    .pipe(t.idMapper())           // Use human-friendly id for known sensors
    .pipe(t.prefixResources())    // { id: 1, foo: 2} => { 1/foo: 2 }
    .pipe(t.throttle(60 * 1000))  // Limit publish to 1/60Hz
}