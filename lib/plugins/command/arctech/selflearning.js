var config = require("../../../../remotes.js")

module.exports = function(ev) {
    var house = config[ev.house] || {}
    var tuple = house[ev.unit]
    if (tuple) {
        return { 
            id: tuple[0], 
            dimLevel: (ev.method == 'turnoff') ? 0 : tuple[1]
        }
    }
}
