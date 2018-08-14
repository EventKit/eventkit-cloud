#!/bin/sh

set -e

cmake --no-print-directory -DCMAKE_INSTALL_PREFIX:PATH=$PREFIX .

make install
