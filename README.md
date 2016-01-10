# smart-home
My smart home setup using Nodejs streams, Telenor Cloud Connect / AWS IoT, 1-wire, Raspberry Pi etc

Given the state of the world one could argue that these items actually constitute "problems", but they we're important enough to me at the time to create this project. Basically I wanted to improve on my existing light automation and also get a better feeling for temperatures and humidity levels at home.

1. More flexible light control: In system Nexa, physical access to the receiver is required in order to enable pairing mode. Re-arranging groups and adding receivers or remotes is a major PITA when using an in-wall receivers.

2. Monitoring: humidity level in suspended foundation ("krypgrund") and the water temperature in my floor heating system

When I bought the Nexa dimmers, I also got a Tellstick Duo. It's a USB device that receives and transmits RF-signals (433Mhz), which basically means that you can use it as a light remote or collect readings from wireless sensors.

I realized that the Tellstick could be used as a "mapping layer" between my remotes and dimmer receivers. This would allow me to pair each device once (with the Tellstick) and then control the mapping / grouping completely in software. At first I was concerned about the extra latency between a button press and effect, but a quick proof of concept showed that it was almost not noticable.

Next, I used the Tellstick to listen for sensor transmissions and found both my 433 Mhz temperature + humidity devices. After adding a simple writable stream on top of AWS IoT SDK, sensor readings started flowing into my Kibana visualizations.

For the floor heating I bought two 1-wire temperature sensors which I glued against the flow and return pipe of my floor heating distribution central. At this point i migrated the smart-home software from my iMac to a Raspberry PI installed in the floor heating distribution central to avoid cable installations.

In my professional life, I'm a software developer at Telenor Connexion so the choice of an IoT backend was not so hard :) We're building our own platform on top of AWS IoT called "Cloud Connect" so i deciced to use it. The code in this repo can also be used with a vanilla AWS account, if you want to build your own time series storage, visualizations etc.
