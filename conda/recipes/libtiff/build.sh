#!/bin/sh

set -e

export CPPFLAGS="-I$PREFIX/include -I$PREFIX/lib"

./configure --prefix=$PREFIX

make > /dev/null
make install
