var config = {
    15112914: {
        // Kitchen remote, page 2
        5: [ 1, 16  ],
        6: [ 1, 64  ],
        7: [ 1, 128 ],
        8: [ 1, 255 ]
    },
    16449394: {
        // Livingroom remote, page 2
        5: [ 1, 16  ],
        6: [ 1, 64  ],
        7: [ 1, 128 ],
        8: [ 1, 255 ]
    },

    13781774: {
        // On/off fob by the door
        3: [ 1, 128 ]  
    },
    74738: {
        // Crappy, plastic 3 button remote
        16: [ 1, 16 ],
        15: [ 1, 128 ],
        14: [ 1, 255 ]
    }
}


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