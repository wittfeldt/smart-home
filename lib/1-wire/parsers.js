/* 1-wire family => payload parser function
*/

module.exports = {
    
    // DS18X20/DS1822 Temperature sensor
    
    "28": function(line) {
        var match = line.match(/t=([0-9]+)$/)
        var val = match[1]
        if (val && !isNaN(val)) {
            return {
                temperature: parseInt(val) / 1000
            }
        } else {
            console.error("Could not parse temperature:", line)
        }
    }
}