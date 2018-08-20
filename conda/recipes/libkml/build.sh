#!/bin/sh

set -e

export CPPFLAGS="-I$PREFIX/include -I$PREFIX/lib"

sed -i "s|zlib.net|zlib.net/fossils|" cmake/External_zlib.cmake
cmake  -DCMAKE_INSTALL_PREFIX:PATH=$PREFIX . > /dev/null
make install

