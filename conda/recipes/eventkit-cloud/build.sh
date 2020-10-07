#!/bin/bash

set -e

cp -R config/ui/. ./
npm install
npm run build

ls -al eventkit_cloud/ui/static/ui
ls -al eventkit_cloud/ui/static/ui/build

$PYTHON -m pip install . -vv
