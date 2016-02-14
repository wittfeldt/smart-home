var _ = require("lodash")
var through2 = require("through2")
var mergeStream = require("merge-stream")
var buttonMap = require("../config/remotes")

module.exports = {
    
    dimCommands: function(tellstick, mqtt) {
        var _433Dimmer = tellstick.pipe(through2.obj(function(obj, enc, done) {
            var house = buttonMap[obj.house] || {}
            var tuple = house[obj.unit]
            if (tuple) {
                this.push({ 
                    id: "light" + tuple[0], 
                    dimLevel: (obj.method == 'turnoff') ? 0 : tuple[1]
                })
            }
            done()
        }))

        var mqttDimmer = mqtt.pipe(through2.obj(function(obj, enc, done) {
            var self = this
            _.each(obj, function(v, k) {
                if (k.match(/light/)) {
                    self.push({
                        id: k, 
                        dimLevel: v
                    })
                }
            })
            done()
        }))

        var dimCommands = mergeStream()
        dimCommands.add(_433Dimmer)
        dimCommands.add(mqttDimmer)
    
        return dimCommands
    },
    
    dimExec: function(dimCommands, tellstick) {
        dimCommands
        .pipe(through2.obj(function(obj, enc, done) {
            var id = parseInt(obj.id.replace("light", ""))
            switch(obj.dimLevel) {
            case 0:
                this.push([ "tdTurnOff", id ])
                break
            case 255:
                this.push([ "tdTurnOn",  id ])
                break
            default:
                this.push([ "tdDim",  id, obj.dimLevel ])
            }
            done()
        })).pipe(tellstick)
    }
}