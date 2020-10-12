#!/usr/bin/env bash

set -e
export BIN_DIR="${PREFIX}/bin"
export OSMCTOOLS_SHARE="${PREFIX}/osmctools-share"
export OSMCTOOLS_DOC="${PREFIX}/osmctools-doc"

mkdir "${OSMCTOOLS_SHARE}" "${OSMCTOOLS_DOC}"

autoreconf --install

./configure --prefix="${PREFIX}" \
            --bindir="${BIN_DIR}" \
            --datarootdir="${OSMCTOOLS_SHARE}" \
            --docdir="${OSMCTOOLS_DOC}"
make
make install

rm -rf "${OSMCTOOLS_SHARE}" "${OSMCTOOLS_DOC}"
