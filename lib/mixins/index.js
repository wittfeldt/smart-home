module.exports = {
    extend: function extend(destination, source) {
        for (var k in source) {
            if (source.hasOwnProperty(k)) {
                destination[k] = source[k];
            }
        }
        return destination; 
    },
    options: require("./options"),
    polling: require("./polling")
}