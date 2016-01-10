# smart-home
My smart home setup using nodejs, AWS IoT, 1-wire, Raspberry PI etc

Given the state of the world one could argue that these items actually constitute "problems", but they we're important enough to me at the time to create this project. Basically I wanted to improve on my existing light automation and also get a better feeling for temperatures and humidity levels at home.

1. In system Nexa, physical access to the receiver is required in order to enable pairing mode. Re-arranging groups and adding receivers or remotes is a major PITA when using an in-wall installation.

2. I wanted to monitor the humidity level in suspended foundation ("krypgrund" in swedish) and also the water temperature in my floor heating system

When I bought the Nexa dimmers, I also got a Tellstick Duo. It's a device that you connect to your computer via USB that can receive and transmit RF-signals, which basically means that you can use it as a light remote or collect readings from various wireless sensors.

I realized that the Tellstick could be used as a "mapping layer" between my remotes and dimmer receivers. This would allow me to pair each device once (with the Tellstick) and then control the mapping / grouping completely in software. At first I was concerned about the extra latency between a button press and effect, but a quick proof of concept showed that it was almost not noticable.

Next, I used the Tellstick to listen for sensor transmissions and found both my 433 Mhz temperature + humidity devices. 

For the floor heating I bought two 1-wire temperature sensors which I glued against the flow and return pipe of my floor heating distribution central. Up until now I had been running the smart-home software on my iMac, but to avoid having long cables I migrated to a Raspberry PI installed in the floor heating distribution central.

In my proffessional life, I'm a software developer at Telenor Connexion so the choice of an IoT backend was not so hard :) We're building our own platform on top of AWS IoT called Cloud Connect so i deciced to use it. The code in this repo can also be used with a standard AWS account, if you want to build your own time series storage, visualizations etc.
