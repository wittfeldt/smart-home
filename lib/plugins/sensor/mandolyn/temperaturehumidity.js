module.exports = function(ev) {
    if (ev.id && (ev.temperature || ev.humidity)) {
        return [ "temperature", "humidity" ].reduce(function(memo, k) {
            if (ev[k]) memo[k] = parseFloat(ev[k])
            return memo
        }, { id: ev.id })
    }
}