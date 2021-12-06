set LIBRARY_INC=%PREFIX%\Library\include
set LIBRARY_LIB=%PREFIX%\Library\lib

pushd swig\python

%PYTHON% setup.py build_ext ^
        --include-dirs %LIBRARY_INC% ^
        --library-dirs %LIBRARY_LIB% ^
        --gdal-config gdal-config
%PYTHON% setup.py build_py
%PYTHON% setup.py build_scripts
%PYTHON% setup.py install

popd
