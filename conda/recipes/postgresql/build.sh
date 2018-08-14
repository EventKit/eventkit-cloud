#!/bin/sh

set -e

export CFLAGS="-I$PREFIX/include"
export LDFLAGS="-L$PREFIX/lib -lxml2 -L$PREFIX/lib -lxslt"
export LDFLAGS_EX="$LDFLAGS -L$PREFIX/lib -lreadline"

./configure --prefix=$PREFIX \
        --with-readline        \
        --with-python          \
        --with-openssl         \
        --with-libxml          \
        --with-libxslt

make > /dev/null
make install
make install-world
