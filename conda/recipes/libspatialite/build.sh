#!/bin/bash

set -e

export LDFLAGS="-L$PREFIX/lib $LDFLAGS"
export CFLAGS="-I$PREFIX/include $CFLAGS"

if [ -f ${PREFIX}/${HOST}/lib/libstdc++.la ]; then
    find ${PREFIX} -name "*.la" -print0 | xargs -0 rm
fi

./configure --prefix=$PREFIX \
            --with-geosconfig=$PREFIX/bin/geos-config \
            --with-proj-include=$PREFIX/include \
            --with-proj-lib=$PREFIX/lib \
            --with-geos-include=$PREFIX/include \
            --with-geos-lib=$PREFIX/lib

make > /dev/null
make install
