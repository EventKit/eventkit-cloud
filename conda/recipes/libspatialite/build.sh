#!/bin/bash

set -e

export LDFLAGS="-L$PREFIX/lib $LDFLAGS"
export CFLAGS="-I$PREFIX/include $CFLAGS"

./configure --prefix=$PREFIX \
            --with-geosconfig=$PREFIX/bin/geos-config \
            --with-proj-include=$PREFIX/include \
            --with-proj-lib=$PREFIX/lib \
            --with-geos-include=$PREFIX/include \
            --with-geos-lib=$PREFIX/lib

make
make install
