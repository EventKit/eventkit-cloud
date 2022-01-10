#!/usr/bin/env bash

set -e

source /opt/conda/etc/profile.d/conda.sh
conda activate
conda config --set channel_priority flexible
conda install python=3.9 --yes
conda update conda --all --yes
conda install "conda-build" "mamba"  --yes

echo "Clearing out conda-bld"
rm -rf /opt/conda/conda-bld
rm -rf /opt/conda/pkgs

echo "Rebuilding conda-bld"
mkdir -p /opt/conda/conda-bld/linux-64
mkdir -p /opt/conda/conda-bld/noarch
conda index /opt/conda/conda-bld

echo "Adding channels"
conda config --add channels defaults
conda config --add channels conda-forge
conda config --add channels local

cd /home/conda/repo
mkdir -p /home/conda/repo/linux-64 /home/conda/repo/noarch
conda index . || echo "JSON Parse Error"
conda config --add channels file://home/conda/repo/

function create_index {
  pushd /home/conda/repo/linux-64/
  python /home/conda/download_packages.py
  popd

  echo "Move files and create index"
  echo "Copying files..."
  find /opt/conda/ -type f -name "*.tar.bz2" -exec cp {} /home/conda/repo/linux-64/ \; || echo "No .tar.bz2 files to move"
  find /opt/conda/ -type f -name "*.conda" -exec cp {} /home/conda/repo/linux-64/ \; || echo "No .conda files to move"
  echo "Ensuring repo channel is priority"
  conda config --add channels file://home/conda/repo/
  pushd /home/conda/repo

  echo "Creating the repo index..."
  conda index .
  popd
  echo "done."
}

echo "Converting the requirements.txt to a format compatible with conda."
python /home/conda/convert_requirements_to_conda.py
cat /home/conda/recipes/eventkit-cloud/conda-requirements.txt

echo "Building recipes"
cd /home/conda/recipes
if [ -z "$1" ]; then
  export COMMAND="conda"
  export RECIPES=$(tr '\r\n' ' ' < /home/conda/recipes.txt)
  echo "***Building all recipes in recipes.txt***"
else
  export COMMAND=$1 # When running individual recipes, choose conda or mamba e.g. ./build.sh mamba eventkit-cloud
  shift
  export RECIPES=$@ # Pass one or many recipes e.g. ./build.sh mamba mapproxy eventkit-cloud
fi
echo "***Building $RECIPES with $COMMAND...***"

for RECIPE in $RECIPES; do
  for i in 1; do
    echo "Building: ${RECIPE}"
    $COMMAND build $RECIPE --numpy 1.21.2 --skip-existing --strict-verify \
    && echo "Installing: ${RECIPE}" \
    && echo "y" | $COMMAND install $RECIPE && create_index\
    && s=0 && break || s=$? && sleep 5;
  done; (exit $s)
done

create_index

echo "Cleaning up the conda-requirements.txt after the build."
rm /home/conda/recipes/eventkit-cloud/conda-requirements.txt
