#!/bin/bash

set -e

cp -R config/ui/. ./
npm install
npm run build

ls -al eventkit_cloud/ui/static/ui
ls -al eventkit_cloud/ui/static/ui/build

$PYTHON -m pip install . -vv

mkdir -p $PREFIX/envs/eventkit-cloud/lib/

cp /usr/lib/x86_64-linux-gnu/libGL.so.1 $PREFIX/lib/libGL.so.1
cp /usr/lib/x86_64-linux-gnu/libGLX.so.0 $PREFIX/lib/libGLX.so.0
cp /usr/lib/x86_64-linux-gnu/libGLdispatch.so.0 $PREFIX/lib/libGLdispatch.so.0
