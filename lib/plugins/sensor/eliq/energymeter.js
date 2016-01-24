var _ = require("lodash")

module.exports = function(ev) {
    if (ev.id && ev.power) {
        return _.pick(ev, [ "id", "power" ])
    }
}