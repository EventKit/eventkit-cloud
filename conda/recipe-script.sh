#!/bin/bash

set -e

export PATH="$HOME/miniconda2/bin:$PATH"

echo "Clearing out conda-bld"
rm -rf /root/miniconda2/conda-bld
rm -rf /root/miniconda2/pkgs

echo "Rebuilding conda-bld"
mkdir -p /root/miniconda2/conda-bld/linux-64
mkdir -p /root/miniconda2/conda-bld/noarch
conda index /root/miniconda2/conda-bld/linux-64
conda index /root/miniconda2/conda-bld/noarch

echo "Adding channels"
conda config --remove channels defaults
conda config --add channels defaults
conda config --add channels conda-forge
conda config --add channels bioconda
conda config --add channels local

echo "Building recipes"
cd recipes

echo "***Building openjpeg...***"
for i in 1 2 3; do conda build openjpeg && s=0 && break || sleep 15; done; (exit $s)

echo "***Building proj...***"
for i in 1 2 3; do conda build proj && s=0 && break || sleep 15; done; (exit $s)

echo "***Building geos...***"
for i in 1 2 3; do conda build geos && s=0 && break || sleep 15; done; (exit $s)

echo "***Building freexl...***"
for i in 1 2 3; do conda build freexl && s=0 && break || sleep 15; done; (exit $s)

echo "***Building libspatialite...***"
for i in 1 2 3; do conda build libspatialite && s=0 && break || sleep 15; done; (exit $s)

echo "***Building readosm...***"
for i in 1 2 3; do conda build readosm && s=0 && break || sleep 15; done; (exit $s)

echo "***Building spatialite...***"
for i in 1 2 3; do conda build spatialite && s=0 && break || sleep 15; done; (exit $s)

echo "***Building json-c...***"
for i in 1 2 3; do conda build json-c && s=0 && break || sleep 15; done; (exit $s)

echo "***Building libtiff...***"
for i in 1 2 3; do conda build libtiff && s=0 && break || sleep 15; done; (exit $s)

echo "***Building libkml...***"
for i in 1 2 3; do conda build libkml && s=0 && break || sleep 15; done; (exit $s)

echo "***Building libgeotiff...***"
for i in 1 2 3; do conda build libgeotiff && s=0 && break || sleep 15; done; (exit $s)

echo "***Building postgres...***"
for i in 1 2 3; do conda build postgres && s=0 && break || sleep 15; done; (exit $s)

echo "***Building postgis...***"
for i in 1 2 3; do conda build postgis && s=0 && break || sleep 15; done; (exit $s)

echo "***Building libgdal...***"
for i in 1 2 3; do conda build libgdal && s=0 && break || sleep 15; done; (exit $s)

echo "***Building gdal...***"
for i in 1 2 3; do conda build gdal && s=0 && break || sleep 15; done; (exit $s)

echo "***Building berkeleydb...***"
for i in 1 2 3; do conda build berkeleydb && s=0 && break || sleep 15; done; (exit $s)

echo "***Building openldap...***"
for i in 1 2 3; do conda build openldap && s=0 && break || sleep 15; done; (exit $s)

echo "***Building osmctools...***"
for i in 1 2 3; do conda build osmctools && s=0 && break || sleep 15; done; (exit $s)

echo  "***Building django-audit-logging...***"
for i in 1 2 3; do conda build django-audit-logging && s=0 && break || sleep 15; done; (exit $s)

cd /root

mkdir -p /root/repo/noarch
echo '{}' > /root/repo/noarch/repodata.json
bzip2 -k /root/repo/noarch/repodata.json

mkdir -p /root/repo/linux-64
echo '{}' > /root/repo/linux-64/repodata.json
bzip2 -k /root/repo/linux-64/repodata.json

echo "Move files and create index"
cp /root/miniconda2/pkgs/*.tar.bz2 /root/repo/linux-64/
cp /root/miniconda2/conda-bld/linux-64/*.tar.bz2 /root/repo/linux-64/

conda config --add channels file://root/repo/
cd /root/repo
conda index linux-64 noarch

