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

cd /root
conda config --add channels file://root/repo/
conda index linux-64 noarch

echo "Building recipes"
cd /root/recipes
echo "***Building $1...***"
for i in 1 2 3; do conda build $1 && s=0 && break || sleep 15; done; (exit $s)

echo "Move files and create index"
cp /root/miniconda2/pkgs/*.tar.bz2 /root/repo/linux-64/
cp /root/miniconda2/conda-bld/linux-64/*.tar.bz2 /root/repo/linux-64/

conda config --add channels file://root/repo/
cd /root/repo
conda index linux-64 noarch

