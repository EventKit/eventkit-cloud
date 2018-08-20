#!/bin/sh

set -e

./configure --prefix=$PREFIX

make > /dev/null
make install
