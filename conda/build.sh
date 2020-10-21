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
  # Note the exit 0 are because the cp conda-bld command could fail if only indexing and not building.
  cp -f /root/miniconda3/pkgs/*.tar.bz2 /root/repo/linux-64/ || exit 0
  cp -f /root/miniconda3/conda-bld/*/*.tar.bz2 /root/repo/linux-64/ || exit 0

  conda config --add channels file://root/repo/
  pushd /root/repo
  conda index linux-64 noarch || echo "JSON Parse Error"
  popd
}

cd /root/recipes
export RECIPES="/root/recipes.txt"

if [ -z "$1" ]; then
  echo "***Building all recipes in recipe.txt**"
  NAMES=$(tr '\n' ' ' < $RECIPES)
  echo $NAMES
  conda build $NAMES
#  while read recipe; do
#      echo "***Building  $recipe ...***"
#      NAME=$(echo $recipe | tr -d '\r')
#      for i in 1 2 3; do conda build $NAME && \
#      echo "y" | conda install $NAME && s=0 && break || s=$? && sleep 5; done; (exit $s)
#      create_index
#  done < $RECIPES
else
  echo "***Building $@...***"
  for i in 1 2 3; do conda build $@ && echo "y" | conda install $@ && s=0 && break || s=$? && sleep 5; done; (exit $s)
fi

create_index

