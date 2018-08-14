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

cd /root/repo
mkdir -p /root/repo/linux-64 /root/repo/noarch
conda index linux-64 noarch
conda config --add channels file://root/repo/

echo "Building recipes"
cd /root/recipes
if [ -z "$1" ]; then
    echo "***Building all recipes in recipes.txt**"
    while read recipe; do
        echo "***Building  $recipe ...***"
        for i in 1 2 3; do conda build $(echo "$recipe" | tr -d '\r') && s=0 && break || sleep 15; done; (exit $s)
    done < /root/recipes.txt
else
 echo "***Building $@...***"
    for i in 1 2 3; do conda build $@ && s=0 && break || sleep 15; done; (exit $s)
fi
echo "Move files and create index"
cp /root/miniconda2/pkgs/*.tar.bz2 /root/repo/linux-64/
cp /root/miniconda2/conda-bld/linux-64/*.tar.bz2 /root/repo/linux-64/

conda config --add channels file://root/repo/
cd /root/repo
conda index linux-64 noarch

