#!/bin/bash

set -e

export CPPFLAGS="-I$PREFIX/include -I$PREFIX/lib"

./configure --prefix=$PREFIX
make && make test && make install
