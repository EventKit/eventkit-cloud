#!/usr/bin/env bash

set -e

export LDFLAGS="-L$PREFIX/lib $LDFLAGS -liconv"
export CFLAGS="-I$PREFIX/include $CFLAGS"

./configure --prefix=$PREFIX \
            --with-geosconfig=$PREFIX/bin/geos-config \
            --with-spatialite-lib=$PREFIX/lib

make > /dev/null
make install
