/* 1-wire family code => parser function
*/

module.exports = {
    
    // DS18X20/DS1822 Temperature sensor
    
    28: function(line) {
        var match = line.match(/t=([0-9]+)$/)
        var val = match[1]
        if (val && !isNaN(val)) {
            return {
                temperature: parseInt(val) / 1000
            }
        } else {
            console.error("Could not parse temperature:", line)
        }
    },
    
    // Default parser, output key = value or raw string
    
    default: function(line) {
        var m = line.match(/^.* ([^=]*)=(.*)$/)
        if (m) {
            var obj = {}
            obj[m[1]] = m[2]
            return obj
        } else {
            return { raw: line }
        }
    }
}