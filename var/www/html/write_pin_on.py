#/usr/bin/env python
import sys
import RPi.GPIO as GPIO
import argparse
##########################################################################
# sys.argv is an array containing the name of the script at index 0,     #
# followed by all passed in arguments in subsequent indexes. In this     #
# case it is expected the passed in argument to be a string representing #
# a number. See write_all_off.py for more info on antenna numbers.       #
#																		 #
# left = 11																 #
# front = 13														     #
# right = 15															 #
# rear = 7																 #
##########################################################################
GPIO.setwarnings(False)
GPIO.cleanup()
GPIO.setmode(GPIO.BOARD)

pin_number = int(sys.argv[1])

antenna_array = [11, 13, 15]

GPIO.setup(11, GPIO.OUT)
GPIO.setup(13, GPIO.OUT)
GPIO.setup(15, GPIO.OUT)

if pin_number == 11:
	GPIO.output(11, GPIO.LOW)
	GPIO.output(13, GPIO.HIGH)
	GPIO.output(15, GPIO.HIGH)
elif pin_number == 13:
	GPIO.output(11, GPIO.HIGH)
	GPIO.output(13, GPIO.LOW)
	GPIO.output(15, GPIO.HIGH)
elif pin_number == 15:
	GPIO.output(11, GPIO.HIGH)
	GPIO.output(13, GPIO.HIGH)
	GPIO.output(15, GPIO.LOW)
