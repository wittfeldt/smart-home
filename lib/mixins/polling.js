var _ = require("lodash")

module.exports = {
    _start: function() {
        this._poll()
        setInterval(this._poll.bind(this), this.options.interval)
    },
    
    _poll: function() {
        var self = this
        this._readSensors()
        .then(function(readings) {
            _.each(readings, function(r) {
                self.push(r)
            })
        })
    },
    
    _read: function (size) {
    },
    
    defaultOptions: {
        interval: 60*1000
    }
}