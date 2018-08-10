#!/bin/sh

set -e

./configure --prefix=$PREFIX --with-libtiff=$PREFIX

make
make install
