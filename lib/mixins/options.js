var _ = require("lodash")

module.exports = {
    _setOptions: function(options, requiredKeys) {
        var merged = _.merge(this.defaultOptions, options || {})
        var missing = _.filter(requiredKeys || [], function(key) {
            return (typeof merged[key] === 'undefined')
        })
        if (missing.length > 0) {
            throw new Error("Required options: " + missing.join(", "))
        }
        this.options = merged
    }
}