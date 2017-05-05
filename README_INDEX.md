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
