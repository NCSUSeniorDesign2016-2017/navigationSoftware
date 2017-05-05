# index.js

#### NodeJS Requires
At the top of the file are the NodeJS Requires declarations. This is where the external libraries, installed with npm and package.json, are linked to the javascript code. Additional libraries should be defined here.

#### Server variables
As many global variables as could be are defined in this section. This is where you can change the some of the default configurations for the system, such as the default antennaLayout and the defauly activeAntenna. Extremely important are the antenna pin variables:
```
var left_antenna = 11;
var front_antenna = 13;
var right_antenna = 15;
var rear_antenna = 5;
```
The numbers for these variables represent GP/IO pins on the raspberry pi 3. These pins are the ones that connect to the solenoid relay's control inputs, which in turn controls the 12V RF switch. When referring to the GP/IO pin numbers on this chart: https://ms-iot.github.io/content/images/PinMappings/RP2_Pinout.png, there are two sets of definitions. The first set is the "name" definition, which are things like "3.3V PWR", "GND", and "GPIO 17". These names are NOT what the pin numbers are referring to. The second set of definitions are the grey numbered boxes next to each pin like 1, 3, 7, and 11. These are the numbers that we're referring to when we define left_antenna to be pin 11. 

The idealAngle variable is used to choose which satellite should be used when two different satellites have overlapping coverage. The selectedSatellite variable sets the default satellite. 

The gps_interface variable, 
```
var gps_interface = '/dev/ttyS0';
```
selects where the serial GPS data is coming from. If you are using the serial pins on the raspberry pi, and the front panel GPS SMA connector, you must use /dev/ttyS0. If you use a USB GPS module+antenna, you must change gps_interface to '/dev/ttyACM0'.

#### TCP Socket
The TCP socket section contains all of the code used to connect the raspberry pi to the Explorer 710 terminal so it can send and recieve AT Commands. AT_ISIG=1 will return the signal strength that the terminal detects, AT+CCLK? returns the time that the terminal thinks it is, and AT_ITREBOOT=42,1,"00:00" tells the terminal to reboot at time "00:00". NOTE: The terminal will NOT reboot if it has not recieved an updated time from a connected antenna. If there is no connected antenna when the terminal boots up, you will be unable to reboot it through software. It is important to never allow the system to try to switch to an antenna that isn't connected to the system, and appropriately set the system configuration for the number of antennas you have connected.

#### Serial Port
This section is where the system listens for GPS data over the serial interface. Every time an updated GPS location is recieved, the system runs through several functions to choose the best satellite, update the satellite bearing, and select the best antenna based on that bearing and the current aircraft heading. 

#### Server API Calls
This section is where all of the client controls are carried out, such as when you use the webUI to manually switch to a specific antenna. 

#### Iperf Shell Execution
This function executes the iperf_test.sh script and returns the results of that script's output.

#### Periodic Interval Functions
Several functions are set to run continuously at set intervals. The first one checks for both the serial port and the TCP port connections, and allows the server to re-connect if either of them are disconnected without crashing. The second sends an AT_ISIG= command to the BGAN terminal to get an updated signal strength for display on the webUI.

#### Other Functions
This is where all of the othre functions not specifically associated with the network interfaces are contained. Both the logic functions for selecting the best satellite, and selecting the best antenna, are found here. switchLogic() is very important for the automatic switching, and is what would be changed to add additional antennas and antenna layouts. 

#### switchLogic()
At the top of this function are local variables. The first,
```
var edgeBuffer = 5;
```
defines the size of the buffer between each "slice" of the pie alloted to an antenna. This is necessary to prevent edge cases where the system might switch back and forth between adjacent antennas over and over and over in a short timespan. The next, 
```
var view_angle = 45;
```
defines the expected width of each antenna beam in azimuth from the center. For a view angle of 45 we're saying 45 degrees in each direction fron the center of the antenna, so 90 degrees in total. This number must be adjusted if more than 3 antennas are used to prevent overlapping. In order to get the right_heading, we take the forward heading and add 90 degrees to it. Likewise we subtract 90 degrees for the left_heading. To add intermediate headings, more or less than 90 degrees will have to be added or subtracted. A switch statement checks the antennaLayout before taking actions. Current possible antennaLayouts are:
* fl - front left
* rf - right front
* fl - right left
* frl - front right left
