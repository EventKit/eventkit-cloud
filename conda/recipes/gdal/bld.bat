call "%RECIPE_DIR%\set_bld_opts.bat"

nmake /f makefile.vc %BLD_OPTS%
if errorlevel 1 exit 1

