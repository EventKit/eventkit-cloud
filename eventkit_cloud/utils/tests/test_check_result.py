# -*- coding: utf-8 -*-
import copy
import logging
from unittest.mock import Mock, patch

import requests
from django.conf import settings
from django.core.cache import cache
from django.test import TransactionTestCase

from eventkit_cloud.utils.services.check_result import CheckResult
from eventkit_cloud.utils.services.ogcapi_process import OGCAPIProcess
from eventkit_cloud.utils.services.wcs import WCS
from eventkit_cloud.utils.services.wfs import WFS
from eventkit_cloud.utils.services.wms import WMS
from eventkit_cloud.utils.services.wmts import WMTS

logger = logging.getLogger(__name__)


def get_status(result):
    """
    Given a CheckResult, return its status ID.
    """
    return result.value["status"]


class TestServiceCheck(TransactionTestCase):
    def setUp(self):
        self.path = settings.ABS_PATH()
        self.aoi_geojson = (
            '{"features": [{"geometry": {"type": "Polygon", "coordinates": '
            "[[ [0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0], [0.0, 0.0] ]]}}]}"
        )

    def check_ows(self, service_type, service, invalid_content, empty_content, no_intersect_content, valid_content):
        """
        Checks the status of a WFS, WCS, WMS, or WMTS service.
        :param get: Patched requests.get
        :param pc: ProviderCheck instance
        :param invalid_content: XML representing an unrecognized response
        :param empty_content: XML representing response lacking requested layer
        :param no_intersect_content: XML representing response with requested layer that does not intersect AOI
        :param valid_content: XML representing response with requested layer that intersects AOI
        """

        mock_session = Mock()
        service.session = mock_session

        with patch("eventkit_cloud.utils.services.base.cache") as mock_cache:

            mock_cache.get.return_value = None
            mock_cache.get_or_set = lambda *args, **kwargs: service.check_response()

            # Test: cannot connect to server
            mock_session.get.side_effect = requests.exceptions.ConnectionError()
            result_status = service.check()["status"]
            self.assertEqual(get_status(CheckResult.CONNECTION), result_status)
            cache.delete(service.get_cache_key())

            # Test: server throws SSL exception
            mock_session.get.side_effect = requests.exceptions.SSLError()
            result_status = service.check()["status"]
            self.assertEqual(get_status(CheckResult.SSL_EXCEPTION), result_status)

            # Test: server returns unauthorized response code
            mock_session.get.side_effect = None
            response = Mock()
            response.content = ""
            response.status_code = 403
            response.ok = False
            mock_session.get.return_value = response
            result_status = service.check()["status"]
            self.assertEqual(get_status(CheckResult.UNAUTHORIZED), result_status)

            # Test: server returns 404 response code
            response.status_code = 404
            mock_session.get.return_value = response
            result_status = service.check()["status"]
            self.assertEqual(get_status(CheckResult.NOT_FOUND), result_status)

            # Test: server does not return recognizable xml
            response.content = invalid_content
            response.status_code = 200
            response.ok = True
            mock_session.get.return_value = response
            result_status = service.check()["status"]
            self.assertEqual(get_status(CheckResult.UNKNOWN_FORMAT), result_status)

            if service_type not in ["wms", "wmts"]:  # TODO: fix layer checks for WMS/WMTS
                # Test: server does not offer the requested layer/coverage
                response.content = empty_content
                mock_session.get.return_value = response
                result_status = service.check()["status"]
                self.assertEqual(get_status(CheckResult.LAYER_NOT_AVAILABLE), result_status)

            if service_type not in ["wms", "wmts"]:  # TODO: fix layer checks for WMS/WMTS
                # Test: requested layer/coverage does not intersect given AOI
                response.content = no_intersect_content
                mock_session.get.return_value = response
                result_status = service.check()["status"]
                self.assertEqual(get_status(CheckResult.NO_INTERSECT), result_status)

            # Test: success
            response.content = valid_content
            mock_session.get.return_value = response
            result_status = service.check()["status"]
            self.assertEqual(get_status(CheckResult.SUCCESS), result_status)
            cache.delete(service.get_cache_key())

            # Test: no service_url was provided
            service.service_url = ""
            result_status = service.check()["status"]
            self.assertEqual(get_status(CheckResult.NO_URL), result_status)

    def test_check_wfs(self):
        url = "http://example.com/wfs?"
        layer = "exampleLayer"
        service = WFS(url, layer, self.aoi_geojson)

        invalid_content = """<WFS_Capabilities xmlns="http://www.opengis.net/wfs">
                             </WFS_Capabilities>""".encode()
        empty_content = """<WFS_Capabilities xmlns="http://www.opengis.net/wfs">
                               <FeatureTypeList>
                               </FeatureTypeList>
                           </WFS_Capabilities>""".encode()
        no_intersect_content = """<WFS_Capabilities xmlns="http://www.opengis.net/wfs">
                                      <FeatureTypeList>
                                          <FeatureType>
                                              <Name>exampleLayer</Name>
                                              <LatLongBoundingBox maxx="11" maxy="11" minx="10" miny="10"/>
                                          </FeatureType>
                                      </FeatureTypeList>
                                  </WFS_Capabilities>""".encode()
        valid_content = """<WFS_Capabilities xmlns="http://www.opengis.net/wfs">
                               <FeatureTypeList>
                                   <FeatureType>
                                       <Name>exampleLayer</Name>
                                       <LatLongBoundingBox maxx="1" maxy="1" minx="-1" miny="-1"/>
                                   </FeatureType>
                               </FeatureTypeList>
                           </WFS_Capabilities>""".encode()

        self.check_ows("wfs", service, invalid_content, empty_content, no_intersect_content, valid_content)

    def test_check_wcs(self):
        url = "http://example.com/wcs?"
        coverage = "exampleCoverage"
        service = WCS(url, coverage, self.aoi_geojson)

        invalid_content = "".encode()
        empty_content = """<wcs:WCS_Capabilities xmlns:gml="http://www.opengis.net/gml" xmlns:wcs="http://www.opengis.net/wcs">
                               <wcs:ContentMetadata>
                               </wcs:ContentMetadata>
                           </wcs:WCS_Capabilities>""".encode()
        no_intersect_content = """<wcs:WCS_Capabilities xmlns:gml="http://www.opengis.net/gml" xmlns:wcs="http://www.opengis.net/wcs">
                                      <wcs:ContentMetadata>
                                          <wcs:CoverageOfferingBrief>
                                              <wcs:Name>exampleCoverage</wcs:Name>
                                              <wcs:lonLatEnvelope srsName="urn:ogc:def:crs:OGC:1.3:CRS84">
                                                   <gml:pos>10 10</gml:pos>
                                                   <gml:pos>11 11</gml:pos>
                                               </wcs:lonLatEnvelope>
                                          </wcs:CoverageOfferingBrief>
                                      </wcs:ContentMetadata>
                                  </wcs:WCS_Capabilities>""".encode()
        valid_content = """<wcs:WCS_Capabilities xmlns:gml="http://www.opengis.net/gml" xmlns:wcs="http://www.opengis.net/wcs">
                               <wcs:ContentMetadata>
                                   <wcs:CoverageOfferingBrief>
                                       <wcs:Name>exampleCoverage</wcs:Name>
                                       <wcs:lonLatEnvelope srsName="urn:ogc:def:crs:OGC:1.3:CRS84">
                                            <gml:pos>-1 -1</gml:pos>
                                            <gml:pos>1 1</gml:pos>
                                        </wcs:lonLatEnvelope>
                                   </wcs:CoverageOfferingBrief>
                               </wcs:ContentMetadata>
                           </wcs:WCS_Capabilities>""".encode()

        self.check_ows("wcs", service, invalid_content, empty_content, no_intersect_content, valid_content)

    def test_check_wms(self):
        url = "http://example.com/wms?"
        layer = "exampleLayer"
        config = {"sources": {"default": {"req": {"layers": layer}}}}
        service = WMS(url, layer, self.aoi_geojson, config=config)
        invalid_content = "".encode()
        empty_content = """<WMT_MS_Capabilities version="1.1.1">
                               <Capability>
                               </Capability>
                           </WMT_MS_Capabilities>""".encode()

        no_intersect_content = """<WMT_MS_Capabilities version="1.1.1">
                                      <Capability>
                                          <Layer>
                                              <Layer>
                                                  <Name>exampleLayer</Name>
                                                  <LatLonBoundingBox minx="10" miny="10" maxx="11" maxy="11"/>
                                              </Layer>
                                          </Layer>
                                      </Capability>
                                  </WMT_MS_Capabilities>""".encode()

        valid_content = """<WMT_MS_Capabilities version="1.1.1">
                               <Capability>
                                   <Layer>
                                       <Name>exampleLayer</Name>
                                       <LatLonBoundingBox minx="-1" miny="-1" maxx="1" maxy="1"/>
                                   </Layer>
                               </Capability>
                           </WMT_MS_Capabilities>""".encode()

        self.check_ows("wms", service, invalid_content, empty_content, no_intersect_content, valid_content)

        service = WMS(url, layer, self.aoi_geojson, config=config)
        valid_content = """<WMT_MS_Capabilities version="1.3.0">
                        <Capability>
                            <Layer>
                                <Name>exampleLayer</Name>
F                                <EX_GeographicBoundingBox>
                                    <westBoundLongitude>-1</westBoundLongitude>
                                    <eastBoundLongitude>1</eastBoundLongitude>
                                    <southBoundLatitude>-1</southBoundLatitude>
                                    <northBoundLatitude>1</northBoundLatitude>
                                </EX_GeographicBoundingBox>
                            </Layer>
                        </Capability>
                    </WMT_MS_Capabilities>""".encode()

        self.check_ows("wms", service, invalid_content, empty_content, no_intersect_content, valid_content)

    def test_check_wmts(self):
        url = "http://example.com/wmts?"
        layer = "exampleLayer"
        config = {"sources": {"default": {"req": {"layers": layer}}}}
        service = WMTS(url, layer, self.aoi_geojson, config=config)

        invalid_content = "".encode()
        empty_content = """<Capabilities version="1.0.0">
                               <Contents>
                               </Contents>
                           </Capabilities>""".encode()

        no_intersect_content = """<Capabilities version="1.0.0">
                                      <Contents>
                                          <Layer>
                                              <Layer>
                                                  <Title>exampleLayer</Title>
                                                  <WGS84BoundingBox>
                                                       <LowerCorner>10 10</LowerCorner>
                                                       <UpperCorner>11 11</UpperCorner>
                                                  </WGS84BoundingBox>
                                              </Layer>
                                          </Layer>
                                      </Contents>
                                  </Capabilities>""".encode()

        valid_content = """<Capabilities version="1.0.0">
                               <Contents>
                                   <Layer>
                                       <Identifier>exampleLayer</Identifier>
                                       <WGS84BoundingBox>
                                            <LowerCorner>-1 -1</LowerCorner>
                                            <UpperCorner>1 1</UpperCorner>
                                       </WGS84BoundingBox>
                                   </Layer>
                               </Contents>
                           </Capabilities>""".encode()

        self.check_ows("wmts", service, invalid_content, empty_content, no_intersect_content, valid_content)

    def test_has_valid_process_inputs(self):
        url = "http://example.com/ogcapi"
        layer = "exampleLayer"
        config = {
            "ogcapi_process": {
                "id": "export-example-bundle",
                "inputs": {"product": "example-product", "file_format": "example-file-format"},
            }
        }
        service = OGCAPIProcess(url, layer, self.aoi_geojson, config=config)
        empty_content = {}
        valid_content = {
            "version": "1.0.0",
            "id": "export-example-bundle",
            "title": "Example Bundle",
            "description": "Example Bundle",
            "inputs": {
                "product": {
                    "title": "Product ID",
                    "description": "The short name of the product type to export.",
                    "keywords": [],
                    "metadata": [],
                    "schema": {"type": "string", "enum": ["example-product"]},
                },
                "file_format": {
                    "title": "File Format",
                    "description": "The file format to export in.",
                    "keywords": [],
                    "metadata": [],
                    "schema": {"type": "string", "enum": ["example-file-format"]},
                },
            },
        }

        mock_session = Mock()
        service.session = mock_session

        response = Mock()

        # Test bad response.
        response.status_code = 404
        self.assertFalse(service.has_valid_process_inputs())

        # Test empty response.
        response.status_code = 200
        response.json.return_value = empty_content
        mock_session.get.return_value = response
        self.assertFalse(service.has_valid_process_inputs())

        # Test no matching id.
        content_no_id = copy.deepcopy(valid_content)
        content_no_id.pop("id")
        response.json.return_value = content_no_id
        mock_session.get.return_value = response
        self.assertFalse(service.has_valid_process_inputs())

        # Test invalid inputs.
        content_invalid_inputs = copy.deepcopy(valid_content)
        content_invalid_inputs["inputs"] = {"invalid-input": {}}
        response.json.return_value = content_invalid_inputs
        mock_session.get.return_value = response
        self.assertFalse(service.has_valid_process_inputs())

        # Test no matching input values.
        content_invalid_input_values = copy.deepcopy(valid_content)
        content_invalid_input_values["inputs"]["product"]["schema"]["enum"] = ["invalid-value"]
        response.json.return_value = content_invalid_input_values
        mock_session.get.return_value = response
        self.assertFalse(service.has_valid_process_inputs())

        # Test valid response.
        response.json.return_value = valid_content
        mock_session.get.return_value = response
        self.assertTrue(service.has_valid_process_inputs())
