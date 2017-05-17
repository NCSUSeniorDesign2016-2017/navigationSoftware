# Debugging and Logging
One of the most essential tasks to writing and modifying software is debugging and logging. Often the very first thing you'll want to do is make note of what's happening as the code is running in order to identify not only how it works normally, but also where potential errors may be occurring. Because the system uses a server and a client, there are two differnet places that can be looked at for debugging and logging.

## Server
Normally the server starts up automatically and provides no way to see any logs or outputs. The first step to debugging and logging the server should be to disable this automatic startup: 
1. Connect to the raspberry pi's wifi network, and then open a suitable terminal (putty on Windows, terminals on OSX and Linux). 
2. Using your terminal, ssh into 192.168.42.1 on port 22. If you followed previous setup guides, you should use the user named "aircraft" and the password "wolfpack".
3. Once you've gained access to the raspberry pi, you can disable the automatic startup by accessing crontab
```
sudo crontab -e
```
4. Scroll to the bottom of the crontab file and place a single # at the beginning of the last line (the one that starts with @reboot). This comments out the line so that it is not run. Save the crontab, and reboot the raspberry pi.
```
ESC
:wq
ENTER
sudo reboot now
```
5. Once the raspberry pi starts up again, the server will no longer be running. SSH into the raspberry pi as you did in step 2 and navigate to the /var/www/html/ directory.
```
cd /var/www/html/
```
6. Run the server manually by running npm start as root.
```
sudo npm start
```
7. Your terminal should now display output from the running server. Any time a connection is made to the server from a client, it will show here. In addition, any console.log() statement in /var/www/html/routes/index.js will show up here as well. Adding console.log() statements to the code is an essential part of figuring out what's going on, and whether the numbers and values that you think the server should be seeing are what they should be. 
8. When finished, simply uncomment the last line in crontab by removing the # sign, save and reboot. Now the server will start up automatically again. 

## Client
Debugging the client is in some ways more straightforward than debugging the server. 
1. Connect to the raspberry pi's wifi network, and then open a suitable web browser. I reccommend Chrome, but Firefox and Safari may also be used and they all have similar functionality. 
2. Ensure the server is actually running on the raspberry pi, either automatically or manually. 
3. Visit the webUI from your browser at http://192.168.42.1:8000. 
4. When the webUI is loaded, right click anywhere on the browser window and select the "Inspect" option (also Ctrl+Shift+J in Chrome). This opens up the browser's debugging interface. This interface contains a ton of options, but the one we will be interested in 90% of the time is the Console. This will show you any errors or warnings that the running scripts encounter, as well as show any console.log() statements you've entered into the client code. As with the server, console.log() statements are an essential part of figuring out what's going on, and whether the webUI is actually doing what you want it to do. 
6. While debugging the live site has it's uses, it's often faster and less of a headache to work with a locally running instance of the webUI instead. Instructions for setting up and running a version of the webUI on http://localhost:8000 can be found in README.md
