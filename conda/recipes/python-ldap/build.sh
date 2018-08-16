#!/bin/bash

cat << EOF > setup.cfg
[_ldap]
library_dirs = $PREFIX/openldap-2.4/lib
include_dirs = $PREFIX/openldap-2.4/include $PREFIX/include/sasl

extra_compile_args = -g
extra_objects =

libs = ldap_r lber sasl2 ssl crypt
EOF

python setup.py install \
       --single-version-externally-managed \
       --record=record.txt

