#!/bin/sh

set -e

export CPPFLAGS="-I$PREFIX/include -I$PREFIX/lib"

cd build_unix
../dist/configure --prefix=$PREFIX
make > /dev/null
make install
