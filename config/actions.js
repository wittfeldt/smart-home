module.exports = {
    dimLevel: function(tellstick, id, value) {
        var id = parseInt(id.replace("light", ""))
        var cmd = null
        value = parseInt(value)
        switch(value) {
        case 0:
            cmd = [ "tdTurnOff", id ]
            break
        case 255:
            cmd = [ "tdTurnOn",  id ]
            break
        default:
            cmd = [ "tdDim",  id, value ]
        }
        tellstick.write(cmd)
    }
}
