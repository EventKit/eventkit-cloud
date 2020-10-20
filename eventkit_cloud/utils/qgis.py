import os
import osgeo
import gdal

# Need to resolve dependencies to include this as a part of our pipeline.


def convert_qgis_gpkg_to_kml(qgs_file: str, output_kml_path: str) -> str:
    from qgis.core import QgsApplication, QgsProject, QgsVectorLayer

    app = None
    driverName = 'libkml'

    try:
        # Load application to load QApplication dependencies.
        app_directory = "./"  # hosts various session type files like qgis.db etc...
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
        output_dir = os.path.join('.', 'kml')

        for layer_name, layer in layers.items():
            output_file = os.path.join(output_dir, f"{layer.name()}.kml")
            if not os.path.exists(output_dir):
                os.mkdir(output_dir)
            QgsVectorFileWriter.writeAsVectorFormat(layer=layer,
                                                    fileName=output_file,
                                                    fileEncoding="utf-8",
                                                    driverName=driverName,
                                                    symbologyExport=QgsVectorFileWriter.SymbolLayerSymbology,
                                                    symbologyScale=symbology_scale)

        out_driver = osgeo.ogr.GetDriverByName(driverName)
        if os.path.exists(output_kml_path):
            out_driver.DeleteDataSource(output_kml_path)

        out_driver.CreateDataSource(output_kml_path)

        kml_files = os.listdir(output_dir)
        for kml_file in kml_files:
            kml_path = os.path.join(output_dir, kml_file)
            gdal.VectorTranslate(output_kml_path, kml_path, accessMode="append")

        return output_kml_path
    finally:
        if app:
            app.exit()
