#!/bin/bash

CFLAGS="-I$PREFIX/include -I$PREFIX/include/sasl" $PYTHON setup.py install --single-version-externally-managed --record=record.txt
