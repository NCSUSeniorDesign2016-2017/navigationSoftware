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

## Raspbian Installation
#### The first step will be to install the standard Raspbian Linux operating system into a microSD card. For the best documentation on this process, refer to https://www.raspberrypi.org/documentation/installation/installing-images/. This guide assumes you will be using the Raspbian Jesse Lite image.  
1. Download the Raspbian Jesse Lite image: https://downloads.raspberrypi.org/raspbian_lite_latest 
2. Extract the downloaded .zip file anywhere. 
2. For Windows computers, download and install the Win32DiskImager tool: https://sourceforge.net/projects/win32diskimager/
3. Insert a clean microSD card into the computer using either an SD-to-microSD or USB-to-microSD adapter. The size of the microSD card is not very important, but it's a good idea to have one that is at least 4GB or larger. The senior design project used a 16GB microSD card. 
3. Run Win32DiskImager and select the "2017-04-10-raspbian-jessie-lite.img" file that you extracted, and select Device drive letter for the microSD card you inserted.
4. Click the "Write" button and wait for it to complete.
5. Close the imager and eject the microSD card.

#### Configurating Raspbian
1. Insert the microSD card into your raspberry pi.

#### Cloning the git repository
1. Install git.
```
sudo apt-get install git
```
2. Clone the code repository. It will be placed in a folder called navigationSoftware in the directory you run this command in. It is reccommended to place this in your home directory. 
```
cd ~/
git clone https://github.com/NCSUSeniorDesign2016-2017/navigationSoftware.git
```

#### Server Installation
The server requires you to have nodejs and npm installed before hand.
1. Install npm.
```
sudo apt-get install npm
```
2. Install nodejs v4.8.1. It's important to get this exact version of nodejs, or else some of the required libraries will not work. To do this we need to add node 4.x to the package repository before running the install nodejs command.
```
curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
sudo apt-get install nodejs
```
3. Ensure you have nodejs v4.x.x installed.
```
node -v
```
4. Install apache2 to actually serve up the web pages.
```
sudo apt-get install apache2
```
5. Apache places a default index.html file in /var/www/html/ upon installation. Delete this file.
```
sudo rm -f /var/www/html/index.html
```
6. Copy the contents of the /var/www/html/ folder from this repository to the /var/www/html/ folder on the raspberry pi. 
```
sudo cp -R ~/navigationSoftware/var/www/html/ /var/www/html/
```
7. Navigate to /var/www/html/
```
cd /var/www/html
```
8. There are two "programs" inside of this folder. One is the nodejs server located in /var/www/html/, and the other is the webUI client code located in /var/www/html/client. They both have their own separate package.json files, which contain lists of the external libraries that need to be installed. First install the package.json files for the server. When finished there will be a new folder called node_modules inside of /var/www/html/.
```
npm install
```
9. Then install the package.json files for the client. When finished there will be a new folder called node_modules inside of /var/www/html/client/.
```
cd client/
npm install
```
10. Build the client javascript. The client is an angular2 application, which means that the important code is written in typescript files with .ts extensions, and then compiled into javascript files with .js extensions. While it's possible to edit the javascript files directly, it's easier and more correct to edit the typescript files and then re-compile them. 
```
npm start
```
11. This will cause the angular2 applcation to start running independently. If you had a GUI and a browser, you could visit http://localhost:3000. In this case we just cared about compiling the typescript, so we can go ahead and stop the local server.
```
Ctrl+C
Ctrl+C
```
