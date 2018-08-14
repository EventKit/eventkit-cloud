#!/bin/sh

set -e

export CPPFLAGS="-I$PREFIX/include -I$PREFIX/lib"

sed -i "s|zlib.net|zlib.net/fossils|" cmake/External_zlib.cmake
cmake --no-print-directory -DCMAKE_INSTALL_PREFIX:PATH=$PREFIX .
make install

