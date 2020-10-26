export PATH="$HOME/miniconda3/bin:$PATH"

echo "Clearing out conda-bld"
rm -rf /root/miniconda3/conda-bld
rm -rf /root/miniconda3/pkgs

echo "Rebuilding conda-bld"
mkdir -p /root/miniconda3/conda-bld/linux-64
mkdir -p /root/miniconda3/conda-bld/noarch
conda index /root/miniconda3/conda-bld

echo "Adding channels"
conda config --add channels defaults
conda config --add channels conda-forge
conda config --add channels local

cd /root/repo
mkdir -p /root/repo/linux-64 /root/repo/noarch
conda index . || echo "JSON Parse Error"
conda config --add channels file://root/repo/

function create_index {
  echo "Move files and create index"
  echo "Copying files..."
  cp -f /root/miniconda3/**/*.tar.bz2 /root/repo/linux-64/ || echo "No .tar.bz2 files to move"
  cp -f /root/miniconda3/**/*.conda /root/repo/linux-64/ || echo "No .conda files to move"
  echo "Ensuring repo channel is priority"
  conda config --add channels file://root/repo/
  pushd /root/repo

  echo "Creating the repo index..."
  conda index . || echo "JSON Parse Error"
  popd
  echo "done."
}

echo "Building recipes"
cd /root/recipes
if [ -z "$1" ]; then
  export RECIPES=$(tr '\r\n' ' ' < /root/recipes.txt)
  echo "***Building all recipes in recipes.txt***"
else
  export RECIPES=$@
fi
echo "***Building $RECIPES...***"

for RECIPE in $RECIPES; do
  for i in 1 2 3; do
    conda build $RECIPE --skip-existing --strict-verify --merge-build-host \
    && echo "y" | conda install --no-update-deps $RECIPE && s=0 && \
    break || s=$? && sleep 5;
  done; (exit $s)
done

pushd /root/repo/linux-64/
python /root/download_packages.py
popd

create_index
