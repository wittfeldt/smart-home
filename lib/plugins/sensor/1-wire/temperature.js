function getTemperature(data) {
    var lines = data.split("\n")
    if (lines[0].match(/YES$/)) {
        var match = lines[1].match(/t=([0-9]+)$/)
        var str = match[1]
        if (str && !isNaN(str)) {
            return parseInt(str) / 1000
        } else {
            console.error("1-wire temperature parse", lines[1])
        }
    } else {
        console.error("1-wire temperature CRC", lines[0])
    }
}

module.exports = function(ev) {
    if (ev.id && ev.data) {
        var t = getTemperature(ev.data)
        if (typeof t != 'undefined') {
            return { 
                id: ev.id, 
                temperature: t
            }
        }
    }
}