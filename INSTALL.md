# Burn image

https://www.raspberrypi.org/documentation/installation/installing-images/mac.md

```
diskutil list
# replace disk3 below with the id of the SD-card!
diskutil unmountDisk /dev/disk3
sudo dd bs=1m if=./2015-11-21-raspbian-jessie-lite.img of=/dev/rdisk3
sudo diskutil eject /dev/rdisk3
```

# Setup

Create ~/.ssh and ~/.aws as appropriate
```
sudo raspi-config # expand filesystem
sudo apt-get update
sudo apt-get dist-upgrade
sudo reboot
sudo apt-get -y install git build-essential
```

# Install Node

http://weworkweplay.com/play/raspberry-pi-nodejs/
```
wget http://node-arm.herokuapp.com/node_latest_armhf.deb
sudo dpkg -i node_latest_armhf.deb
sudo npm install -g forever
```
# Install Telldus-Core

https://blogg.itslav.nu/?p=875

Create file /etc/apt/sources.list.d/telldus.list with the following content :

`deb-src http://download.telldus.com/debian/ stable main`

```
wget http://download.telldus.se/debian/telldus-public.key
sudo apt-key add telldus-public.key
sudo apt-get update
sudo apt-get build-dep telldus-core
sudo apt-get install cmake libconfuse-dev libftdi-dev help2man

mkdir -p ~/telldus-temp
cd ~/telldus-temp
sudo apt-get -b source telldus-core
sudo dpkg -i libtelldus-core2_2.1.2-1_armhf.deb
sudo dpkg -i libtelldus-core-dev_2.1.2-1_armhf.deb
sudo dpkg -i telldus-core_2.1.2-1_armhf.deb
```

Add to /boot/config.txt :
`dtoverlay=w1-gpio,gpiopin=4`
    
Modify /etc/tellstick.conf :
```
device {
    id = 1
    name = "group-all"
    model = "selflearning-dimmer:nexa"
    parameters {
        house = "16449394"
        unit = "1"
    }
}
```

# Install smart-home

```
git clone git@github.com:wittfeldt/smart-home.git
cd smart-home && npm install
```

Add to /etc/rc.local
`su - pi -c "cd ~/smart-home && forever start -a --uid smart-home index.js -t <thing name>`

Create file /etc/logrotate.d/forever with the following content :
```
/home/pi/.forever/*.log {
    rotate 4
    weekly
    compress
    missingok
    notifempty
}
```

# Cleanup

`sudo apt-get clean`

# Backup SD-card

https://smittytone.wordpress.com/2013/09/06/back-up-a-raspberry-pi-sd-card-using-a-mac/

`sudo dd if=/dev/rdisk3 bs=1m | gzip > ~/Desktop/pi.gz`

# Restore SD-card

```
diskutil unmountDisk /dev/disk3`
gzip -dc ~/Desktop/pi.gz | sudo dd of=/dev/rdisk3 bs=1m
```
