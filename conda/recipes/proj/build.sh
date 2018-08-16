#!/bin/sh

set -e

export CFLAGS="-I$PREFIX/include"

./configure --prefix=$PREFIX

make > /dev/null
make install

ACTIVATE_DIR=$PREFIX/etc/conda/activate.d
DEACTIVATE_DIR=$PREFIX/etc/conda/deactivate.d
mkdir -p $ACTIVATE_DIR
mkdir -p $DEACTIVATE_DIR

cat << EOF > $ACTIVATE_DIR/proj-activate.sh
#!/bin/bash
if [[ -z "PROJ_LIB" ]]; then
  export PROJ_LIB=$PREFIX/share/proj
  export _CONDA_SET_PROJ_LIB=1
fi
EOF

cat << EOF > $DEACTIVATE_DIR/proj-deactivate.sh
#!/bin/bash
if [[ -n "_CONDA_SET_PROJ_LIB" ]]; then
  unset PROJ_LIB
  unset _CONDA_SET_PROJ_LIB
fi
EOF
