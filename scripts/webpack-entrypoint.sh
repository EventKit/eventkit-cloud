#!/bin/bash

set -e

#run webpack to transpile JS
webpack

#Allow other command to be ran
cmd="$@"
exec $cmd
