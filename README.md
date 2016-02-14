# smart-home
My smart home setup using Nodejs streams, Telenor Cloud Connect / AWS IoT, 1-wire, Raspberry Pi etc

Given the state of the world one could argue that these items actually constitute "problems", but they we're important enough to me at the time to create this project. Basically I wanted to improve on my existing light automation and also get a better feeling for temperatures and humidity levels at home.

1. More flexible light control: In system Nexa, physical access to the receiver is required in order to enable pairing mode. Re-arranging groups and adding receivers or remotes is a major PITA when using an in-wall receivers.

2. Monitoring: humidity level in suspended foundation ("krypgrund") and the water temperature in my floor heating system

When I bought the Nexa dimmers, I also got a Tellstick Duo. It's a USB device that receives and transmits RF-signals  on 433Mhz, which basically means that you can use a computer as a remote or collect readings from wireless sensors.

I had this idea of using the Tellstick as a "mapping layer" between my remotes and dimmer receivers. This would allow me to pair each remote / dimmer once (with the Tellstick) and then control the mapping between them completely in software. At first I was concerned about the extra latency between a button press and effect, but a quick proof of concept showed that it was almost not noticable.

Next, I used the Tellstick to listen for sensor transmissions and found periodic transmissions from both my 433 Mhz temperature + humidity stations. After adding a simple writable stream on top of AWS IoT SDK, sensor readings started flowing into my Kibana visualizations.

For the floor heating I bought two 1-wire temperature sensors which I glued against the flow and return pipe of my floor heating distribution central. At this point i migrated the smart-home software from my iMac to a Raspberry PI installed in the floor heating distribution central to avoid cable installations.

In my professional life, I'm a software developer at Telenor Connexion so the choice of an IoT backend was not so hard :) We're building our own platform on top of AWS IoT called "Cloud Connect" so i deciced to use it. The code in this repo can also be used with a vanilla AWS account, if you want to build your own time series storage, visualizations etc.

### Remote testing

RemoteStream.js can be used for executing a readable and/or writable object stream over a SSH connection. Use like this:

```
var sshOpts = {
    host: "192.168.1.161", 
    username: "pi",
    privateKey: require('fs').readFileSync('/Users/andersw/.ssh/id_rsa')
}

tellstick = new RemoteStream("./lib/Tellstick", sshOpts)
oneWire = new RemoteStream("./lib/OneWire", sshOpts)
```

Dependencies must be installed manually on the remote host using npm install -g. You may also need to change the NODE_PATH in RemoteStream.js