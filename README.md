# navigationSoftware

## Description
This repository hosts the various files used and modified for the Aircraft Carry-on Internet senior design project at North Carolina State University. Because part of the system functionality requires configuration of the raspberry pi's linux installation, the filestructure here is based off of the root filestructure found in raspbian linux. This should make it easy for a developer to navigate to those files that need to be added or modified by simply logging into the raspberry pi via ssh. 

## Node.js server (/var/www/html/)
The most important part of the project software is the Node.js server. This server runs constantly while the raspberry pi is powered on, and listens for GPS data from the GPS module. Whenever new GPS data is received, the server runs through calculations to decide which Inmarsat satellite is the most appropriate to select, calculates a vector bearing pointing from it's current location to that satellite, and (if automatic switching is enabled), selects which antenna should have line-of-sight to the satellite and switches to it. The server is also responsible for communicating to the Cobham Explorer 710 BGAN Terminal and sending the critical reboot command that allows the terminal to reboot after the antenna is switched. 

## GPIO Python Scripts (/var/www/html/)
Contained within the same directory as the Node.js server are two python scripts which control the raspberry pi's GPIO pins. The first script, write_all_off.py, is called once when the raspberry pie first starts up to cycle each GPIO pin on and then off. This ensures that the pins are all configured and ready to use by the server when it calls the second python script, write_pin_on.py. 

## foreverStartup.sh (/var/www/html/)
The raspberry pi uses a program called "forever" that watches over the node.js server script and ensures that the script never stops running. If the script does stop running, forever will attempt to re-run the script automatically. foreverStartup.sh contains the actual "forever start" command that needs to be run when the raspoberry pi is turned on. This script is called by a crontab process that is scheduled to run on every "@reboot" event. 

## Crontab (/var/spool/cron/crontabs)
Linux uses a system called "crontab" to schedule automatically executing periodic scrips. Scripts in crontab can be configured to run hourly, daily, or on special events like system reboot. The Aircraft Carry-on Internet system uses the @reboot event to execute the foreverStartup.sh script every time the raspberry pi is powered on, allowing everything necessary to start up and get running without any user interaction required. 

## Raspberry Pi Setup
1. The first step will be to install the standard Raspbian Linux operating system into a microSD card. For the best documentation on this process, refer to https://www.raspberrypi.org/documentation/installation/installing-images/ 
