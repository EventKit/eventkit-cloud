#!/bin/sh

set -e

cmake  -DCMAKE_INSTALL_PREFIX:PATH=$PREFIX . > /dev/null

make install
