/*

Run Readable / Writable / Duplex Stream on remote host via SSH connection

Usage:

var foo = new RemoteStream(__dirname + "/TestDuplex.js", { 
    host: "192.168.1.161", 
    username: "pi",
    privateKey: require('fs').readFileSync('/Users/andersw/.ssh/id_rsa')
})
*/

var Duplex = require("stream").Duplex
var inherits = require("util").inherits
var Client = require('ssh2').Client
var readFileSync = require('fs').readFileSync

function buildCmd(path, streamOpts) {
    var absPath = process.cwd() + "/" + path + ".js"
    return `
        export NODE_PATH=/usr/local/lib/node_modules; 
        node -e '
        ${readFileSync(absPath)};
        var Transform = require("stream").Transform
        var util = require("util")
        
        console.log = function() {
            process.stderr.write(util.format.apply(this, arguments));
        }
    
        function Marshal() {
            Transform.call(this, { objectMode: true })
        }
        util.inherits(Marshal, Transform)
        
        Marshal.prototype._transform = function (obj, enc, done) {
            this.push(JSON.stringify(obj));
            done()
        }
        
        function Unmarshal() {
            Transform.call(this, { objectMode: true })
        }
        util.inherits(Unmarshal, Transform)
        
        Unmarshal.prototype._transform = function (chunk, enc, done) {
            try { 
                this.push(JSON.parse(chunk.toString()))
            } catch(err) {
                console.log(err + chunk.toString())
            }
            done()
        }
        
        var mod = new module.exports(${JSON.stringify(streamOpts)})
        
        // Stream module => SSH
        mod
        .pipe(new Marshal())
        .pipe(process.stdout)
        
        // SSH => Stream module
        process.stdin
        .pipe(new Unmarshal())
        .pipe(mod)
        '
    `
}

function RemoteStream(path, sshOpts, streamOpts) {

    Duplex.call(this, { objectMode: true })
    
    var self = this
    var conn = new Client()
    conn.on('ready', function() {
        console.log("RemoteStream " + path + " ready")
        conn.exec(buildCmd(path), self._initBridge.bind(self))
    })
    
    conn.connect(sshOpts)
}

inherits(RemoteStream, Duplex)

RemoteStream.prototype._initBridge = function(err, stream) {
    if (err) throw err;
    this.stream = stream
    var self = this
    stream.on('close', function(code, signal) {
        self.push(null)
    }).on('data', function(data) {
        self.push(JSON.parse(data))
    })
    .stderr.on('data', function(data) {
        console.log('RemoteStream stderr: ' + data)
    })
}

RemoteStream.prototype._read = function (size) {}

RemoteStream.prototype._write = function (obj, enc, done) {
    if (this.stream) this.stream.write(JSON.stringify(obj));
    done()
}

module.exports = RemoteStream