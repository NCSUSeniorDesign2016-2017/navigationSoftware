# Adding Antennas (WIP)
The provided software has support for up to three antennas, but the big SP8T RF switch can handle 8 antennas. Adding more antennas to the system requires several steps. Defining the GP/IO control pins physically, defining the GP/IO control pins in software, and defining the manual switching, and finally defining the automatic switching.

## 1. Defining the GP/IO control pins physically
The first step in adding a new antenna is selecting which physical GP/IO pins on the raspberry pi you would like to use to control when the new antenna is switched on or not. A useful pin diagram and general explanation can be found here: https://developer.microsoft.com/en-us/windows/iot/docs/pinmappingsrpi, and refrences to pins in this readme are based off of this image: https://az835927.vo.msecnd.net/sites/iot/Resources/images/PinMappings/RP2_Pinout.png

All of the pins labeled GPIO are fair game to use for switching purposes. Each GPIO pin in the image has two numbers associated with it. The first number is inside of the orange block next to the word "GPIO", and references the Broadcom chip numbers (GPIO.BCM). The second number is in the grey block next to each pin's colored block, and refrences the Raspberry Pi's layout numbers (GPIO.BOARD). Since we will be using GPIO.BOARD in our python scripts, the number you want to reference for each pin is the one in the grey block. For example if I want to use the orange pin labeled "GPIO 4", then the number I want to write down is 7 next to it. 

## 2. Defining the GP/IO control pins in software
The raspberry pi's GPIO pins are controlled via python scripts, which are themselves called by the node.js server as necessary. At the top of each python script located in /var/www/html/, you'll want to add in the new numbered pin as a variable.

```
left = 11
front = 13
right = 15
new_antenna = 7
```
The script code underneath will also need to be extended to do the same operations for the new pin that they do for all of the previous pins.

## 3. Defining manual switching

## 4. Defining automatic switching
