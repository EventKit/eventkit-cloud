#!/usr/bin/env bash

version=$1 || $VERSION
vendor=$VENDOR || /usr/local/

python_ver="2.7.13"
lcms_ver="2.8"
gdal_ver="2.3.0"
geos_ver="3.6.0"
hdf5_ver="1.8.18"
libkml_ver="1.3.0"
netcdf_ver="4.4.2"
openjpeg_ver="2.1"
postgresql_ver="9.6.1"
proj_ver="4.9.3"
libspatialite_ver="4.3.0a"
freexl_ver="1.0.2"
openldap_ver="2.4.45"
berkeleydb_ver="6.0.19"


set -eo pipefail

release="cflinuxfs2"
cpu=$(uname -m)
sandbox=/tmp/sandbox

mkdir -p $vendor/{bin,lib,include,share} $sandbox

cd $sandbox

git clone https://github.com/venicegeo/eventkit-cloud
cd eventkit-cloud
PYTHONLIBS_VERSION="$(git describe --abbrev=0 --tags)"

version="${version}" || "${PYTHONLIBS_VERSION}"

cd $sandbox

echo "-----------------"
echo "Version: $version"
echo "Release: $release"
echo "CPU: $cpu"
echo "-----------------"

apt-get update && apt-get install -y doxygen gfortran libtool libffi-dev tk-dev zlib1g-dev libfreetype6-dev libexpat1-dev groff groff-base

if [[ $PATH != *$vendor* ]]; then
  export PATH=$PATH:$vendor/bin
fi

cd $sandbox

CPPFLAGS="-I$vendor/include -L$vendor/lib"
export CPPFLAGS="-I$vendor/include -L$vendor/lib"

wget https://bootstrap.pypa.io/get-pip.py
python get-pip.py

if [ ! -f hdf5-$hdf5_ver.tar.gz ]; then
  wget https://support.hdfgroup.org/ftp/HDF5/releases/hdf5-1.8/hdf5-1.8.18/src/$hdf5_ver.tar.gz
fi
tar -xvf hdf5-$hdf5_ver.tar.gz
cd hdf5-$hdf5_ver
FC=/usr/bin/gfortran ./configure --disable-dependency-tracking \
            --enable-static=no \
            --enable-shared \
            --enable-cxx \
            --enable-fortran \
            --enable-f77 \
            --disable-f03 \
            --prefix=$vendor
make install
cd $sandbox


if [ ! -f netcdf-$netcdf_ver.tar.gz ]; then
  wget https://github.com/Unidata/netcdf-fortran/archive/$netcdf_ver.tar.gz
fi
tar -xvf netcdf-$netcdf_ver.tar.gz
cd netcdf-$netcdf_ver
export CPATH=$vendor/include
export LIBRARY_PATH=$vendor/lib
export LD_LIBRARY_PATH=$vendor/lib
./configure --enable-shared \
            --enable-static=no \
            --prefix=$vendor
make install
cd $sandbox


if [ ! -f libkml-$libkml_ver.tar.gz ]; then
  wget https://github.com/libkml/libkml/archive/$libkml_ver.tar.gz
fi
tar -xvf libkml-$libkml_ver.tar.gz
cd libkml-$libkml_ver
sed -i "s|zlib.net|zlib.net/fossils|" cmake/External_zlib.cmake
cmake -DCMAKE_INSTALL_PREFIX:PATH=$vendor .
make install
cd $sandbox


if [ ! -f Little-CMS-lcms$lcms_ver.tar.gz ]; then
  wget https://sourceforge.net/projects/lcms/files/lcms/2.8/lcms/download$lcms_ver.tar.gz
fi
tar -xvf Little-CMS-lcms$lcms_ver.tar.gz
cd Little-CMS-lcms$lcms_ver
./configure --enable-shared \
            --enable-static=no \
            --program-suffix=2 \
            --prefix=$vendor
sed -i.rpath 's|^hardcode_libdir_flag_spec=.*|hardcode_libdir_flag_spec=""|g' libtool
sed -i.rpath 's|^runpath_var=LD_RUN_PATH|runpath_var=DIE_RPATH_DIE|g' libtool
make install
cd $sandbox


if [ ! -f openjpeg-version.$openjpeg_ver.tar.gz ]; then
  wget https://s3.amazonaws.com/boundless-packaging/whitelisted/src/openjpeg-version.$openjpeg_ver.tar.gz
fi
tar -xvf openjpeg-version.$openjpeg_ver.tar.gz
cd openjpeg-version.$openjpeg_ver
cmake -DCMAKE_INSTALL_PREFIX:PATH=$vendor .
make install
cd $sandbox


if [ ! -f geos-$geos_ver.tar.bz2 ]; then
  wget http://download.osgeo.org/geos/geos-$geos_ver.tar.bz2
fi
tar -xvf geos-$geos_ver.tar.bz2
cd geos-$geos_ver
./configure --prefix=$vendor \
            --enable-static=no \
            --enable-shared
make install
cd $sandbox


if [ ! -f proj-$proj_ver.tar.gz ]; then
  wget https://s3.amazonaws.com/boundless-packaging/whitelisted/src/proj-$proj_ver.tar.gz
fi
tar -xvf proj-$proj_ver.tar.gz
cd proj-$proj_ver/
./configure --prefix=$vendor \
            --enable-static=no \
            --enable-shared
make install
cd $sandbox


if [ ! -f freexl-$freexl_ver.tar.gz ]; then
  wget http://www.gaia-gis.it/gaia-sins/freexl-sources/freexl-$freexl_ver.tar.gz
fi
tar -xvf freexl-$freexl_ver.tar.gz
cd freexl-$freexl_ver/
./configure --prefix=$vendor
make
make install
cd $sandbox


if [ ! -f libspatialite-$libspatialite_ver.tar.gz ]; then
  wget http://www.gaia-gis.it/gaia-sins/libspatialite-sources/libspatialite-$libspatialite_ver.tar.gz
fi
tar -xvf libspatialite-$libspatialite_ver.tar.gz
cd libspatialite-$libspatialite_ver/
./configure --prefix=$vendor \
            --with-geosconfig=$vendor/bin/geos-config
make
make install
cd $sandbox


if [ ! -f gdal-$gdal_ver.tar.gz ]; then
  wget http://download.osgeo.org/gdal/$gdal_ver/gdal-$gdal_ver.tar.gz
fi
tar xf gdal-$gdal_ver.tar.gz
cd gdal-$gdal_ver/
./configure --prefix=$vendor \
    --with-jpeg \
    --with-png=internal \
    --with-geotiff=internal \
    --with-libtiff=internal \
    --with-libz=internal \
    --with-curl \
    --with-gif=internal \
    --with-geos=$vendor/bin/geos-config \
    --with-expat \
    --with-threads \
    --with-libkml=$vendor \
    --with-spatialite \
    --with-openjpeg=$vendor \
    --with-netcdf=$vendor \
    --enable-static=no \
    --enable-shared
make
make install
cd $sandbox

#    --with-pg=$vendor/bin/pg_config \


if [ ! -f $berkeleydb_ver.tar.gz ]; then
  wget http://download.oracle.com/berkeley-db/db-$berkeleydb_ver.tar.gz
fi
tar xf db-$berkeleydb_ver.tar.gz
cd db-$berkeleydb_ver/build_unix
../dist/configure --prefix=$vendor
make
make install
cd $sandbox


if [ ! -f openldap-$openldap_ver.tgz ]; then
  wget ftp://ftp.openldap.org/pub/OpenLDAP/openldap-release/openldap-$openldap_ver.tgz
fi
tar xf openldap-$openldap_ver.tgz
cd openldap-$openldap_ver/
./configure --prefix=$vendor
make
make install
cd $sandbox


if [ ! -f osmctools-master-be1eb365932d1664f45868a0c97b89d4e315877f.tar.gz ]; then
  wget -O osmctools-master-be1eb365932d1664f45868a0c97b89d4e315877f.tar.gz https://gitlab.com/osm-c-tools/osmctools/repository/archive.tar.gz?ref=master
fi
tar xf osmctools-master-be1eb365932d1664f45868a0c97b89d4e315877f.tar.gz
rm -rf osmctools*.tar.gz
cd osmctools-master-*
gcc src/osmupdate.c -o $vendor/bin/osmupdate
gcc src/osmfilter.c -O3 -o $vendor/bin/osmfilter
gcc src/osmconvert.c -lz -O3 -o $vendor/bin/osmconvert
cd $sandbox


rm -fr $vendor/include/boost
find $vendor/lib -type f -name '*.a' -exec rm -f {} +
find $vendor/lib -type f -name '*.la' -exec rm -f {} +


mkdir -p $sandbox/pythonlibs
/usr/local/bin/pip install --upgrade pip
cd $sandbox/eventkit-cloud
/usr/local/bin/pip download -r requirements.txt -d $sandbox/pythonlibs
cd $sandbox/pythonlibs
tar -czf /build/pythonlibs-$PYTHONLIBS_VERSION.$release.$cpu.tar.gz *


cd $vendor
rm -rf $vendor/lib/pkgconfig

tar -C $vendor -czf /build/vendorlibs-$version.$release.$cpu.tar.gz *

