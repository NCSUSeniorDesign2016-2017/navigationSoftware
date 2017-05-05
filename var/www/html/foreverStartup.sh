#!/bin/bash
#sleep 8
cd /var/www/html
sudo python startup_python.py
forever start -c "npm start" "./" >>/home/aircraft/output.log 2>>/home/aircraft/error.log
