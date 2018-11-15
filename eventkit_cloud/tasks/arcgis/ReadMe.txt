EventKit Version 1.1
ESRI ArcMap Support
At Version 1.1 EventKit has beta support for ESRI ArcMap documents (.mxd format).

To create the .mxd, run the 'create_mxd.py' script on a machine that has ArcMap installed.
To run the script, simply double-click on the 'create_mxd.py' file.
If this doesn't work for you, then you may have to explicitly use the correct version of python by opening a command prompt or powershell and typing the full path to the arcmap python installation, for example:
C:\python27\arcmap10.5\python.exe C:\user\Downloads\datapack\arcgis\create_mxd.py.

The script uses templates and .lyr files stored in the "template" folder of the EventKit datapack and leverages the ArcMap libraries already installed on the computer.
The script will create an .mxd for the ArcMap version installed on the machine (ArcMap versions 10.4 - 10.6 are currently supported).

Note, Geopackage (.gpkg) support varies by ArcMap version, with limited functionality for raster geopackage files in versions before ArcMap 10.5.1.
