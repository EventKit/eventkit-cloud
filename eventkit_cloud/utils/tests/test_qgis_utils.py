import os
from unittest import SkipTest
from unittest.mock import call, Mock, patch

from django.conf import settings
from django.test import TestCase

try:
    import qgis  # noqa
except ImportError:
    raise SkipTest("Skipping all QGIS tests because it's not installed.")

from eventkit_cloud.utils.qgis_utils import convert_qgis_gpkg_to_kml


class TestQGIS(TestCase):
    @patch("eventkit_cloud.utils.qgis_utils.gdal")
    @patch("eventkit_cloud.utils.qgis_utils.QgsProject")
    @patch("eventkit_cloud.utils.qgis_utils.osgeo")
    def test_convert_qgis_gpkg_to_kml(self, mock_osgeo, mock_qgs_project, mock_gdal):
        # Setup the mocks and expected values.
        qgs_file = "test.qgs"
        output_kml_path = "test.kml"
        stage_dir = os.path.join(settings.EXPORT_STAGING_ROOT)

        mock_layer_land = Mock()
        mock_layer_land.filename = os.path.join(stage_dir, "kml", "land_polygons.kml")
        mock_layer_land.source.return_value = "layername=land_polygons"
        mock_layer_boundary = Mock()
        mock_layer_boundary.filename = os.path.join(stage_dir, "kml", "boundary.kml")
        mock_layer_boundary.source.return_value = "layername=boundary"
        mock_layer_roads = Mock()
        mock_layer_roads.filename = os.path.join(stage_dir, "kml", "roads_lines.kml")
        mock_layer_roads.source.return_value = "layername=roads_lines"
        # Mimic what mapLayers returns which is a list of tuples containing a name and a layer instance.
        mock_qgs_project.instance.return_value.mapLayers.return_value.items.return_value = [
            ("land_polygons", mock_layer_land),
            ("boundary", mock_layer_boundary),
            ("roads_lines", mock_layer_roads),
        ]

        # Have to use a context manager because this is imported within the function's scope.
        with patch("qgis.core.QgsVectorFileWriter") as mock_qgs_writer:
            kml = convert_qgis_gpkg_to_kml(qgs_file, output_kml_path, stage_dir=stage_dir)

            # Ensure the QGIS project is created.
            mock_qgs_project.instance.assert_called_once()

            # Ensure the layers are all written in the order from the mapLayers list.
            write_vector_format_calls = [
                call(
                    layer=mock_layer_land,
                    fileName=mock_layer_land.filename,
                    fileEncoding="utf-8",
                    driverName="libkml",
                    symbologyExport=mock_qgs_writer.SymbolLayerSymbology,
                    symbologyScale=20000,
                ),
                call(
                    layer=mock_layer_boundary,
                    fileName=mock_layer_boundary.filename,
                    fileEncoding="utf-8",
                    driverName="libkml",
                    symbologyExport=mock_qgs_writer.SymbolLayerSymbology,
                    symbologyScale=20000,
                ),
                call(
                    layer=mock_layer_roads,
                    fileName=mock_layer_roads.filename,
                    fileEncoding="utf-8",
                    driverName="libkml",
                    symbologyExport=mock_qgs_writer.SymbolLayerSymbology,
                    symbologyScale=20000,
                ),
            ]
            mock_qgs_writer.writeAsVectorFormat.assert_has_calls(write_vector_format_calls)

            # Ensure the datasource is created.
            mock_osgeo.ogr.GetDriverByName.assert_called_once_with("libkml")
            mock_osgeo.ogr.GetDriverByName.return_value.CreateDataSource.assert_called_once_with(output_kml_path)

            # Ensure that the layers are all merged in the correct order.
            vector_translate_calls = [
                call(output_kml_path, mock_layer_roads.filename, accessMode="append"),
                call(output_kml_path, mock_layer_land.filename, accessMode="append"),
                call(output_kml_path, mock_layer_boundary.filename, accessMode="append"),
            ]
            mock_gdal.VectorTranslate.assert_has_calls(vector_translate_calls)

            self.assertEqual(kml, output_kml_path)
