chmod 755 configure

set -e

export CPPFLAGS="-I$PREFIX/include -I$PREFIX/lib -L$PREFIX/include -L$PREFIX/lib"

./configure \
    --prefix=$PREFIX \
    --with-pgconfig=$PREFIX/bin/pg_config \
    --with-gdalconfig=$PREFIX/bin/gdal-config \
    --with-xml2config=$PREFIX/bin/xml2-config \
    --with-projdir=$PREFIX \
    --with-lib=$PREFIX \
    --with-jsondir=$PREFIX/lib \
    --with-raster \
    --with-topology

make > /dev/null
make install
