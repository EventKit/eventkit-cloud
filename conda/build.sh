#!/bin/bash

set -e

export PATH="$HOME/miniconda3/bin:$PATH"

echo "Clearing out conda-bld"
rm -rf /root/miniconda3/conda-bld
rm -rf /root/miniconda3/pkgs

echo "Rebuilding conda-bld"
mkdir -p /root/miniconda3/conda-bld/linux-64
mkdir -p /root/miniconda3/conda-bld/noarch
conda index /root/miniconda3/conda-bld/linux-64
conda index /root/miniconda3/conda-bld/noarch

echo "Adding channels"
conda config --add channels defaults
conda config --add channels conda-forge
conda config --add channels local

cd /root/repo
mkdir -p /root/repo/linux-64 /root/repo/noarch
conda index linux-64 noarch || echo "JSON Parse Error"
conda config --add channels file://root/repo/

function create_index {
  echo "Move files and create index"
  cp -f /root/miniconda3/pkgs/*.tar.bz2 /root/repo/linux-64/
  cp -f /root/miniconda3/conda-bld/linux-64/*.tar.bz2 /root/repo/linux-64/

  conda config --add channels file://root/repo/
  pushd /root/repo
  conda index linux-64 noarch || echo "JSON Parse Error"
  popd
}

echo "Building recipes"
cd /root/recipes
if [ -z "$1" ]; then
  echo "***Building all recipes in recipes.txt**"
  while read recipe; do
      echo "***Building  $recipe ...***"
      NAME=$(echo "$recipe" | tr -d '\r')
      for i in 1 2 3; do conda build $NAME && \
      echo "y" | conda install $NAME && s=0 && break || s=$? && sleep 5; done; (exit $s)
      create_index
  done < /root/recipes.txt
else
  echo "***Building $@...***"
  for i in 1 2 3; do conda build $@ && echo "y" | conda install $@ && s=0 && break || s=$? && sleep 5; done; (exit $s)
fi

create_index

