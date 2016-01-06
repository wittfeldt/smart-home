#!/bin/bash

sudo node install -g forever
sudo node install -g forever-service

sudo forever-service install publish-sensors --script publish-sensors.js -r pi --spinSleepTime 3000 --logrotateMax 5 -o " -t thing-1451590431656"
sudo forever-service install light-proxy --script light-proxy.js -r pi --spinSleepTime 3000 --logrotateMax 5

