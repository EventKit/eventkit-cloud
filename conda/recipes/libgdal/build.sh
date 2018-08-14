#!/bin/bash
# Some portions of this code were inspired by conda-forge.

#BSD 3-clause license
#Copyright (c) 2015-2018, conda-forge
#All rights reserved.
#
#Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
#
#1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
#
#2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
#
#3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
#
#THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

set -e # Abort on error.

# Force python bindings to not be built.
unset PYTHON

if [ $(uname) != Darwin ]; then
  export CFLAGS="-O2 -Wl,-S $CFLAGS"
  export CXXFLAGS="-O2 -Wl,-S $CXXFLAGS"
fi
export CPPFLAGS="-I$PREFIX/include"
#export LDFLAGS="-L$PREFIX/lib $LDFLAGS"
#export CFLAGS="-I$PREFIX/include $CFLAGS"

# these files have hardcoded paths in them.  We don't need .la files anyway, so just remove it.
find ${PREFIX} -name "*.la" -print0 | xargs -0 rm

# Filter out -std=.* from CXXFLAGS as it disrupts checks for C++ language levels.
re='(.*[[:space:]])\-std\=[^[:space:]]*(.*)'
if [[ "${CXXFLAGS}" =~ $re ]]; then
    export CXXFLAGS="${BASH_REMATCH[1]}${BASH_REMATCH[2]}"
fi

# `--without-pam` was removed.
# See https://github.com/conda-forge/gdal-feedstock/pull/47 for the discussion.

# Removed HDF4, HDF5, GIF, KEA, XERCES, NETCDF and JSON-C due to failures to build.
#./configure --verbose
./configure --prefix=$PREFIX \
            --host=$HOST \
            --enable-static=no \
            --enable-shared \
            --with-curl \
            --with-expat=$PREFIX \
            --with-geos=$PREFIX/bin/geos-config \
            --with-geotiff=internal \
            --with-jpeg=internal \
            --with-libjson-c=$PREFIX \
            --with-libkml=$PREFIX \
            --with-libz=internal \
            --with-libtiff=internal \
            --with-openjpeg=$PREFIX \
            --with-pg=$PREFIX/bin/pg_config \
            --with-png=$PREFIX \
            --with-spatialite \
            --with-threads \
            --without-python \
            --verbose \
            $OPTS

make  -j $CPU_COUNT ${VERBOSE_AT} > /dev/null

make  -j $CPU_COUNT > /dev/null
make install


ACTIVATE_DIR=$PREFIX/etc/conda/activate.d
DEACTIVATE_DIR=$PREFIX/etc/conda/deactivate.d
mkdir -p $ACTIVATE_DIR
mkdir -p $DEACTIVATE_DIR

cat <<EOF > $ACTIVATE_DIR/gdal-activate.sh
#!/bin/bash
if [[ -z "$GDAL_DATA" ]]; then
  export GDAL_DATA=$(gdal-config --datadir)
  export _CONDA_SET_GDAL_DATA=1
fi
EOF


cat <<EOF > $DEACTIVATE_DIR/gdal-deactivate.sh
#!/bin/bash
if [[ -n "$_CONDA_SET_GDAL_DATA" ]]; then
  unset GDAL_DATA
  unset _CONDA_SET_GDAL_DATA
fi
EOF