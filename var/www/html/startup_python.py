#/usr/bin/env python
import RPi.GPIO as GPIO
import time
#######################################################
# These numbers represent pins on the Raspberry Pi 3. #
# The commented out rear pin and GPIO code would be   #
# uncommeted in order to control a fourth antenna.    #
#######################################################
left = 11
front = 13
right = 15
#rear = 7

GPIO.setwarnings(False)
GPIO.setmode(GPIO.BOARD)

GPIO.setup(left, GPIO.OUT)
GPIO.output(left,GPIO.HIGH)
time.sleep(1)

GPIO.setup(front, GPIO.OUT)
GPIO.output(front, GPIO.HIGH)
time.sleep(1)

GPIO.setup(right, GPIO.OUT)
GPIO.setup(right, GPIO.HIGH)
time.sleep(1)

GPIO.cleanup()
