#!/bin/bash

set -e

./configure --prefix=$PREFIX

make > /dev/null
make install

ACTIVATE_DIR=$PREFIX/etc/conda/activate.d
DEACTIVATE_DIR=$PREFIX/etc/conda/deactivate.d
mkdir -p $ACTIVATE_DIR
mkdir -p $DEACTIVATE_DIR

cat <<EOF > $ACTIVATE_DIR/geos-activate.sh
#!/bin/bash
if [[ -z "GEOS_LIBRARY_PATH" ]]; then
  export GEOS_LIBRARY_PATH=$PREFIX/lib
  export _CONDA_SET_GEOS_LIBRARY_PATH=1
fi
EOF


cat <<EOF > $DEACTIVATE_DIR/geos-deactivate.sh
#!/bin/bash
if [[ -n "_CONDA_SET_GEOS_LIBRARY_PATH" ]]; then
  unset GEOS_LIBRARY_PATH
  unset _CONDA_SET_GEOS_LIBRARY_PATH
fi
EOF

