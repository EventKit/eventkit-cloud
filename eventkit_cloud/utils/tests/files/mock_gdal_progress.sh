# !/bin/bash
#
# GDAL progress string is formatted as:
#   0...10...20...30...40...50...60...70...80...90...100 - done.
#
# We interleave separators non-uniformly to simulate discrepancies with buffering
#

SLEEP=.5s
SEPARATOR=...

printf 0
sleep $SLEEP

printf ${SEPARATOR}10${SEPARATOR}
sleep $SLEEP

printf 20
sleep $SLEEP

printf ${SEPARATOR}30
sleep $SLEEP

printf ${SEPARATOR}40
sleep $SLEEP

printf ${SEPARATOR}5
printf 0${SEPARATOR}
sleep $SLEEP

printf 6
sleep $SLEEP
printf 0
sleep $SLEEP
printf ${SEPARATOR}
sleep $SLEEP

printf 70${SEPARATOR}
sleep $SLEEP

printf 80
sleep $SLEEP

printf ${SEPARATOR}90${SEPARATOR}
sleep $SLEEP

printf "${SEPARATOR}100 - done.\n"
sleep $SLEEP

printf "extra nonsense"
