#/usr/bin/env python
import RPi.GPIO as GPIO

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
GPIO.cleanup()
GPIO.setmode(GPIO.BOARD)
GPIO.setup(left, GPIO.OUT)
GPIO.output(left, GPIO.HIGH)
GPIO.setup(front, GPIO.OUT)
GPIO.output(front, GPIO.HIGH)
GPIO.setup(right, GPIO.OUT)
GPIO.output(right, GPIO.HIGH)
#GPIO.setup(rear, GPIO.OUT)
#GPIO.output(rear, GPIO.LOW)

