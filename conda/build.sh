#!/usr/bin/env bash

set -e

export PATH="$HOME/miniconda3/bin:$PATH"
export CONDA_NPY=$(cat /eventkit-cloud/requirements.txt | grep -e "numpy==" | grep -oEi [0-9].+)
echo "Building using Numpy ==$CONDA_NPY"
echo "Clearing out conda-bld"
rm -rf /root/miniconda3/conda-bld
rm -rf /root/miniconda3/pkgs

echo "Rebuilding conda-bld"
mkdir -p /root/miniconda3/conda-bld/linux-64
mkdir -p /root/miniconda3/conda-bld/noarch
conda index /root/miniconda3/conda-bld

echo "Adding channels"
conda config --remove channels defaults || echo "Defaults already removed."
conda config --add channels conda-forge
conda config --add channels local

cd /root/repo
mkdir -p /root/repo/linux-64 /root/repo/noarch
conda index . || echo "JSON Parse Error"
conda config --add channels file://root/repo/

function create_index {
  pushd /root/repo/linux-64/
  python /root/download_packages.py
  popd

  echo "Move files and create index"
  echo "Copying files..."
  find /root/miniconda3/ -type f -name "*.tar.bz2" -exec cp {} /root/repo/linux-64/ \; || echo "No .tar.bz2 files to move"
  find /root/miniconda3/ -type f -name "*.conda" -exec cp {} /root/repo/linux-64/ \; || echo "No .conda files to move"
  echo "Ensuring repo channel is priority"
  conda config --add channels file://root/repo/

  echo "Creating the repo index..."
  pushd /root/repo
  conda index .
  popd
  echo "done."
}

echo "Converting the requirements.txt to a format compatible with conda."
python /root/convert_requirements_to_conda.py
cat /root/recipes/eventkit-cloud/conda-requirements.txt

echo "Building recipes"
cd /root/recipes
if [ -z "$1" ]; then
  export COMMAND="conda"
  export RECIPES=$(tr '\r\n' ' ' < /root/recipes.txt)
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
    $COMMAND build $RECIPE --strict-verify --merge-build-host --skip-existing && create_index \
    && echo "Installing: ${RECIPE}" \
    && echo "y" | $COMMAND install --no-update-deps $RECIPE && create_index \
    && s=0 && break || s=$? && sleep 5;
  done; (exit $s)
done

echo "Creating a fresh environment to download dependencies."
eval "$(conda shell.bash hook)"
conda env create -f /eventkit-cloud/environment.yml -n deps
conda activate deps
create_index

echo "Updating the conda_build_config.yaml"
python /root/output_config_yaml.py /root/recipes

echo "Cleaning up the conda-requirements.txt after the build."
rm /root/recipes/eventkit-cloud/conda-requirements.txt

