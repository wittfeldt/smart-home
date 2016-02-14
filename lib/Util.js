var _ = require("lodash")

module.exports = {
    checkOptions: function(opts, required) {
        _.each(required, function(key) {
            if (typeof opts[key] === "undefined")
                throw new Error(key + " is required");
        })
        return opts
    }
}