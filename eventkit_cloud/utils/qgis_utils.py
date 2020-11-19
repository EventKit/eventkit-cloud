import logging
import os

import osgeo
import gdal

logger = logging.getLogger(__name__)

try:
    from qgis.core import QgsApplication, QgsProject
except ImportError:
    logger.warning("QGIS is not installed.")


def convert_qgis_gpkg_to_kml(qgs_file: str, output_kml_path: str, stage_dir: str = None) -> str:

    app = None
    driver_name = "libkml"

    try:
        # Load application to load QApplication dependencies.
        app_directory = stage_dir  # hosts various session type files like qgis.db etc...
        app = QgsApplication([], False, app_directory)
        app.initQgis()

        # Application needs to be initialized before importing.
        from qgis.core import QgsVectorFileWriter

        # Load project from template output.
        project = QgsProject.instance()
        if not project.read(qgs_file):
            raise Exception(f"Could not read from {qgs_file}")

        layers = project.mapLayers()
        symbology_scale = 20000
        if stage_dir:
            output_dir = os.path.join(stage_dir, "kml")
        else:
            output_dir = os.path.join(".", "kml")

        kml_files = []
        for layer_name, layer in layers.items():
            output_filename = f"{layer.source().partition('layername=')[2].split('|')[0]}.kml"
            output_filepath = os.path.join(output_dir, output_filename)
            kml_files.append(output_filename)
            if not os.path.exists(output_dir):
                os.mkdir(output_dir)
            QgsVectorFileWriter.writeAsVectorFormat(
                layer=layer,
                fileName=output_filepath,
                fileEncoding="utf-8",
                driverName=driver_name,
                symbologyExport=QgsVectorFileWriter.SymbolLayerSymbology,
                symbologyScale=symbology_scale,
            )

        out_driver = osgeo.ogr.GetDriverByName(driver_name)
        if os.path.exists(output_kml_path):
            out_driver.DeleteDataSource(output_kml_path)

        out_driver.CreateDataSource(output_kml_path)

        # Ensure the land_polygons and boundary layers are at the bottom when the files get merged.
        try:
            kml_files.append(kml_files.pop(kml_files.index("land_polygons.kml")))
            kml_files.append(kml_files.pop(kml_files.index("boundary.kml")))
        except ValueError as ve:
            logger.warning(ve)

        # Merge all of the KML files into a single file.
        for kml_file in kml_files:
            kml_path = os.path.join(output_dir, kml_file)
            gdal.VectorTranslate(output_kml_path, kml_path, accessMode="append")

        return output_kml_path

    finally:
        if app:
            app.exit()
