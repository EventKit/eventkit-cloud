#!/usr/bin/env bash

BIN_DIR="${PREFIX}/bin"
OSMCTOOLS_SHARE="${PREFIX}/osmctools-share"
OSMCTOOLS_DOC="${PREFIX}/osmctools-doc"

mkdir "${OSMCTOOLS_SHARE}" "${OSMCTOOLS_DOC}"

autoreconf --install

./configure --prefix="${PREFIX}" \
            --bindir="${BIN_DIR}" \
            --datarootdir="${OSMCTOOLS_SHARE}" \
            --docdir="${OSMCTOOLS_DOC}" \

make install

rm -rf "${OSMCTOOLS_SHARE}" "${OSMCTOOLS_DOC}"
