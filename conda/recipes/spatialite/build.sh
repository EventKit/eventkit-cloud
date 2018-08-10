#!/usr/bin/env bash

set -e

export LDFLAGS="-L$PREFIX/lib $LDFLAGS"
export CFLAGS="-I$PREFIX/include $CFLAGS"

./configure --prefix=$PREFIX \
            --with-geosconfig=$PREFIX/bin/geos-config \

make
make install
