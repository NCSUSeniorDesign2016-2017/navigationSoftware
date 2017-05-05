#!/bin/bash
export NLS_LANG=AMERICAN_AMERICA.AL32UTF8
DATE=`date +%Y-%m-%d-%H-%M-%S`
OUTPUT="$(/usr/bin/iperf -c 71.69.144.78 -t 25 -i 1)"
printf "%s" "$OUTPUT" >> bandwidth_test_$DATE.txt
echo "${OUTPUT}"
