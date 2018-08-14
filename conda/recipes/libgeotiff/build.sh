#!/bin/sh

set -e

./configure --prefix=$PREFIX --with-libtiff=$PREFIX

make > /dev/null
make install
