set LIBRARY_INC=%PREFIX%\Library\include
set LIBRARY_LIB=%PREFIX%\Library\lib
set LIBRARY_BIN=%PREFIX%\Library\bin
set LIBRARY_PREFIX=%PREFIX%\Library

call "%RECIPE_DIR%\set_bld_opts.bat"

nmake /f makefile.vc devinstall %BLD_OPTS%
if errorlevel 1 exit 1

copy *.lib %LIBRARY_LIB%\ || exit 1
if errorlevel 1 exit 1

set ACTIVATE_DIR=%PREFIX%\etc\conda\activate.d
set DEACTIVATE_DIR=%PREFIX%\etc\conda\deactivate.d
mkdir %ACTIVATE_DIR%
mkdir %DEACTIVATE_DIR%

copy %RECIPE_DIR%\scripts\activate.bat %ACTIVATE_DIR%\gdal-activate.bat
if errorlevel 1 exit 1

copy %RECIPE_DIR%\scripts\deactivate.bat %DEACTIVATE_DIR%\gdal-deactivate.bat
if errorlevel 1 exit 1


:: Copy powershell activation scripts
copy %RECIPE_DIR%\scripts\activate.ps1 %ACTIVATE_DIR%\gdal-activate.ps1
if errorlevel 1 exit 1

copy %RECIPE_DIR%\scripts\deactivate.ps1 %DEACTIVATE_DIR%\gdal-deactivate.ps1
if errorlevel 1 exit 1



:: Copy unix shell activation scripts, needed by Windows Bash users
copy %RECIPE_DIR%\scripts\activate.sh %ACTIVATE_DIR%\gdal-activate.sh
if errorlevel 1 exit 1

copy %RECIPE_DIR%\scripts\deactivate.sh %DEACTIVATE_DIR%\gdal-deactivate.sh
if errorlevel 1 exit 1
