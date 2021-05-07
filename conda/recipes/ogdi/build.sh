#!/usr/bin/env bash

set -e
export TOPDIR=${PREFIX}
echo "****SET TOPDIR AS****"
echo $TOPDIR

autoreconf --install

export CPPFLAGS="-I$PREFIX/include -I$PREFIX/lib"

./configure --prefix=${PREFIX} \
            --with-proj=${PREFIX} \
            --with-zlib=${PREFIX} \
            --with-expat=${PREFIX}

make
make install

