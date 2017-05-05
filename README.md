# navigationSoftware

## Description
This repository hosts the various files used and modified for the Aircraft Carry-on Internet senior design project at North Carolina State University. Because part of the system functionality requires configuration of the raspberry pi's linux installation, the filestructure here is based off of the root filestructure found in raspbian linux. This should make it easy for a developer to navigate to those files that need to be added or modified by simply logging into the raspberry pi via ssh. 

## Node.js server (/var/www/html/)
The most important part of the project software is the Node.js server. This server runs constantly while the raspberry pi is powered on, and listens for GPS data from the GPS module. Whenever new GPS data is received, the server runs through calculations to decide which Inmarsat satellite is the most appropriate to select, calculates a vector bearing pointing from it's current location to that satellite, and (if automatic switching is enabled), selects which antenna should have line-of-sight to the satellite and switches to it. The server is also responsible for communicating to the Cobham Explorer 710 BGAN Terminal and sending the critical reboot command that allows the terminal to reboot after the antenna is switched. The most important pieces of code are found in /var/www/html/routes/index.js. 

## Angular2 Client (/var/www/html/client)
Whenever you connect to the webUI at 192.168.42.1:8000, you will be served up a special client website. This site will talk to the server and display navigation information, as well as allow the user to control some of the server's functions in real time. The client website is built on an angular2 template.

## GPIO Python Scripts (/var/www/html/)
Contained within the same directory as the Node.js server are two python scripts which control the raspberry pi's GPIO pins. The first script, write_all_off.py, is called once when the raspberry pie first starts up to cycle each GPIO pin on and then off. This ensures that the pins are all configured and ready to use by the server when it calls the second python script, write_pin_on.py. 

## foreverStartup.sh (/var/www/html/)
The raspberry pi uses a program called "forever" that watches over the node.js server script and ensures that the script never stops running. If the script does stop running, forever will attempt to re-run the script automatically. foreverStartup.sh contains the actual "forever start" command that needs to be run when the raspoberry pi is turned on. This script is called by a crontab process that is scheduled to run on every "@reboot" event. 

## Crontab (/var/spool/cron/crontabs)
Linux uses a system called "crontab" to schedule automatically executing periodic scrips. Scripts in crontab can be configured to run hourly, daily, or on special events like system reboot. The Aircraft Carry-on Internet system uses the @reboot event to execute the foreverStartup.sh script every time the raspberry pi is powered on, allowing everything necessary to start up and get running without any user interaction required. 

## Network Interfaces (/etc/network/interfaces)
The network interfaces file defines the static IP address for the raspberry pi, which lets you open the website from the same IP address (192.168.42.1:8000) every time the system is rebooted.

## Hostapd Configuration (/etc/hostapd/hostapd.conf)
Hostapd configuration sets up the raspberry pi as a wireless router, allowing you to connect to it with a phone or computer and recieve internet through the pi instead of the Explorer 710 terminal. The pi will recieve it's internet from the Explorer 710 terminal, and then forward that internet to the connected users. 

#### Raspbian Installation
1. The first step will be to install the standard Raspbian Linux operating system into a microSD card. For the best documentation on this process, refer to https://www.raspberrypi.org/documentation/installation/installing-images/. This guide assumes you will be using the Raspbian Jesse Lite image, but it's possible to get the same functionality with a full Raspbian Jesse image as well. The only big difference is that Raspbian Jesse Lite doesn't have a GUI desktop installed by default. 

#### Configurating Raspbian
1. After you have installed Raspbian according to the raspberry pi's documentation guide, you'll want to gain access to the device to make some changes. There are a number of ways to do this, but the best way is to connect an HDMI monitor and a USB keyboard to the raspberry pi and turn it on. After installing Raspbian, there will be some basic options given to you with a tool called raspi-config. Documentation can be found here: https://www.raspberrypi.org/documentation/configuration/raspi-config.md. For this device we want to ensure that SSH and serial ports are enabled. You can enable SSH and Serial by selecting the Advanced Options menu.
2. An optional configuration is changing the hostname. For the Aircraft Carry-on Internet system, we changed the hostname to "carryon". The hostname may be changed in the Advanced Options menu as well.

#### Serial interface permissions
1. Log in to the raspberry pi.
2. In order for the server to have access to the serial port for GPS signals, we need to loosen the permissions for those interfaces by entering the following command in a terminal.
```
sudo chmod a+rwx /dev/ttyS0 /dev/ttyAMA0
```

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
##### The server requires you to have nodejs and npm installed before hand.
1. Install npm.
```
sudo apt-get install npm
```
2. Install nodejs v4.8.1. It's important to get this exact version of nodejs, or else some of the required libraries will not work. To do this we need to add node 4.x to the package repository before running the install nodejs command.
```
curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
sudo apt-get install nodejs
```
3. Ensure you have nodejs v4.x.x installed by checking the version with the -v argument.
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
10. Build the client javascript. The client is an angular2 application, which means that the important code is written in typescript files with .ts extensions, and then compiled into javascript files with .js extensions. While it's possible to edit the javascript files directly, it's easier and more "correct" to edit the typescript files and then re-compile them. 
```
npm start
```
11. This will cause the angular2 applcation to start running independently. If you had a GUI and a browser, you could visit http://localhost:3000. In this case we just cared about compiling the typescript, so we can go ahead and stop the local server by entering Ctrl+C a few times.
```
Ctrl+C
Ctrl+C
```

#### Server Start
1. At this point your client code is ready, and your server is ready, but the server hasn't been started yet. You can start the server manually by entering:
```
cd /var/www/html/
sudo npm start
```
2. Manually running the server isn't practical, however, so we want to set up a cronjob to tell the raspberry pi to automatically start the server in the background. First open up the crontab editor by typing:
```
sudo crontab -e
```
3. At the bottom of the crontab file, paste the following line of text:
```
@reboot /usr/bin/sudo -u root -H /var/www/html/foreverStartup.sh
```
4. Save the crontab file by typing:
```
Ctrl+X
Y
ENTER
```
5. In order for the code inside of foreverStartup.sh to work, we will need to install the software called forever.
```
sudo apt-get install forever
```
5. Now when you reboot the raspberry pi, it will automatically execute the foreverStartup.sh script, which runs "sudo npm start" on the server.

#### Wifi Network
##### Additional documentation: https://www.raspberrypi.org/documentation/configuration/wireless/access-point.md
1. In order to be able to visit the site at the same address every time, we will have to set a static IP address on the raspberry pi's wifi interface. First lets open up the network interfaces file:
```
sudo nano /etc/network/interfaces
```
2. At the bottom of the network interfaces file, paste the following lines:
```
allow-hotplug wlan0
iface wlan0 inet static
  address 192.168.42.1
  netmask 255.255.255.0
```
3. Save the network interfaces file.
```
Ctrl+X
Y
ENTER
```
3. Install hostapd.
```
sudo apt-get install hostapd
```
4. Open the hostapd.conf file:
```
sudo nano /etc/hostapd/hostapd.conf
```
5. Enter the following configuration:
```
interface=wlan0
ssid=carryoninternet
country_code=US
hw_mode=g
channel=6
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wpa=2
wpa_passphrase=wolfpack
wpa_key_mgmt=WPA-PSK
wpa_pairwise=CCMP
wpa_group_rekey=86400
ieee80211n=1
wme_enabled=1
```
6. Save the hostapd.conf file.
```
Ctrl+X
Y
ENTER
```
