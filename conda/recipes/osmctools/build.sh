#!/bin/sh

set -e

ls -al
gcc src/osmupdate.c -o $PREFIX/bin/osmupdate
gcc src/osmfilter.c -O3 -o $PREFIX/bin/osmfilter
gcc src/osmconvert.c -lz -O3 -o $PREFIX/bin/osmconvert
