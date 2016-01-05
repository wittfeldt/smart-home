/* house code, button idx => tdDevice, dimLevel
 * 2 = All dimmers
*/

module.exports = {
    15112914: {
        // Kitchen remote, page 2
        5: [ 2, 16  ],
        6: [ 2, 64  ],
        7: [ 2, 128 ],
        8: [ 2, 255 ]
    },
    16449394: {
        // Livingroom remote, page 2
        5: [ 2, 16  ],
        6: [ 2, 64  ],
        7: [ 2, 128 ],
        8: [ 2, 255 ]
    },

    13781774: {
        // On/off fob by the door
        3: [ 2, 128 ]  
    },
    74738: {
        // Crappy, plastic 3 button remote
        16: [ 2, 16 ],
        15: [ 2, 128 ],
        14: [ 2, 255 ]
    }
}
