#!/bin/bash

set -e

cp -R config/ui/. ./
npm config set python python2.7
npm install
npm run build

python setup.py install --single-version-externally-managed --record=record.txt
