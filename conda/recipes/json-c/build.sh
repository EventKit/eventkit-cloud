#!/bin/sh

set -e

./configure --prefix=$PREFIX

make
make install
