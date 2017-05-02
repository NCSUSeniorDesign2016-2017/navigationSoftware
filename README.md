# navigationSoftware

## Description
This repository hosts the various files used and modified for the Aircraft Carry-on Internet senior design project at North Carolina State University. Because part of the system functionality requires configuration of the raspberry pi's linux installation, the filestructure here is based off of the root filestructure found in raspbian linux. This should make it easy for a developer to navigate to those files that need to be added or modified by simply logging into the raspberry pi via ssh. 

## Node.js server (/var/www/html/)
The most important part of the project software is the Node.js server. This server runs constantly while the raspberry pi is powered on, and listens for GPS data from the GPS module. Whenever new GPS data is received, the server runs through calculations to decide which Inmarsat satellite is the most appropriate to select, calculates a vector bearing pointing from it's current location to that satellite, and (if automatic switching is enabled), selects which antenna should have line-of-sight to the satellite and switches to it. The server is also responsible for communicating to the Cobham Explorer 710 BGAN Terminal and sending the critical reboot command that allows the terminal to reboot after the antenna is switched. 
