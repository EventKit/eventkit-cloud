#!/bin/bash

set -e

cp -R config/ui/. ./
npm config set python python2.7
npm install
npm run build

ls -al eventkit_cloud/ui/static/ui
ls -al eventkit_cloud/ui/static/ui/build

pip install .
