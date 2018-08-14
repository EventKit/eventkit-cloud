#!/bin/sh

set -e

./configure --prefix=$PREFIX

make --no-print-directory
make install
