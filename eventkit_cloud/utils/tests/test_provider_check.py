# -*- coding: utf-8 -*-
import json
import logging
import os
import requests
from django.conf import settings
from django.test import TransactionTestCase
from mock import Mock, patch, MagicMock
from ..provider_check import WCSProviderCheck, WFSProviderCheck, WMSProviderCheck, OverpassProviderCheck, CheckResults

logger = logging.getLogger(__name__)


def get_status(result):
    """
    Given a CheckResult, return its status ID.
    """
    return result.value[0]['status']


class TestProviderCheck(TransactionTestCase):

    def setUp(self, ):
        self.path = settings.ABS_PATH()
        self.aoi_geojson = '{"features": [{"geometry": {"type": "Polygon", "coordinates": ' \
                           '[[ [0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0], [0.0, 0.0] ]]}}]}'

    def check_ows(self, get, pc, invalid_content, empty_content, no_intersect_content, valid_content):
        """
        Checks the status of a WFS, WCS, or WMS service.
        :param get: Patched requests.get
        :param pc: ProviderCheck instance (e.g. WMS, WCS, WFS)
        :param invalid_content: XML representing an unrecognized response
        :param empty_content: XML representing response lacking requested layer
        :param no_intersect_content: XML representing response with requested layer that does not intersect AOI
        :param valid_content: XML representing response with requested layer that intersects AOI
        """
        # Test: cannot connect to server
        get.side_effect = requests.exceptions.ConnectionError()
        result_status = json.loads(pc.check())['status']
        self.assertEquals(get_status(CheckResults.CONNECTION), result_status)

        # Test: server returns unauthorized response code
        get.side_effect = None
        response = MagicMock()
        response.content = ""
        response.status_code = 403
        response.ok = False
        get.return_value = response
        result_status = json.loads(pc.check())['status']
        self.assertEquals(get_status(CheckResults.UNAUTHORIZED), result_status)

        # Test: server does not return recognizable xml
        response.content = invalid_content
        response.status_code = 200
        response.ok = True
        get.return_value = response
        result_status = json.loads(pc.check())['status']
        self.assertEquals(get_status(CheckResults.UNKNOWN_FORMAT), result_status)

        # Test: server does not offer the requested layer/coverage
        response.content = empty_content
        get.return_value = response
        result_status = json.loads(pc.check())['status']
        self.assertEquals(get_status(CheckResults.LAYER_NOT_AVAILABLE), result_status)

        # Test: requested layer/coverage does not intersect given AOI
        response.content = no_intersect_content
        get.return_value = response
        result_status = json.loads(pc.check())['status']
        self.assertEquals(get_status(CheckResults.NO_INTERSECT), result_status)

        # Test: success
        response.content = valid_content
        get.return_value = response
        result_status = json.loads(pc.check())['status']
        self.assertEquals(get_status(CheckResults.SUCCESS), result_status)

    @patch('eventkit_cloud.utils.provider_check.requests.get')
    def test_check_wfs(self, get):
        url = "http://example.com/wfs?"
        layer = "exampleLayer"
        pc = WFSProviderCheck(url, layer, self.aoi_geojson)

        invalid_content = """<WFS_Capabilities xmlns="http://www.opengis.net/wfs">
                             </WFS_Capabilities>"""
        empty_content = """<WFS_Capabilities xmlns="http://www.opengis.net/wfs">
                               <FeatureTypeList>
                               </FeatureTypeList>
                           </WFS_Capabilities>"""
        no_intersect_content = """<WFS_Capabilities xmlns="http://www.opengis.net/wfs">
                                      <FeatureTypeList>
                                          <FeatureType>
                                              <Name>exampleLayer</Name>
                                              <LatLongBoundingBox maxx="11" maxy="11" minx="10" miny="10"/>
                                          </FeatureType>
                                      </FeatureTypeList>
                                  </WFS_Capabilities>"""
        valid_content = """<WFS_Capabilities xmlns="http://www.opengis.net/wfs">
                               <FeatureTypeList>
                                   <FeatureType>
                                       <Name>exampleLayer</Name>
                                       <LatLongBoundingBox maxx="1" maxy="1" minx="-1" miny="-1"/>
                                   </FeatureType>
                               </FeatureTypeList>
                           </WFS_Capabilities>"""

        self.check_ows(get, pc, invalid_content, empty_content, no_intersect_content, valid_content)

    @patch('eventkit_cloud.utils.provider_check.requests.get')
    def test_check_wcs(self, get):
        url = "http://example.com/wcs?"
        coverage = "exampleCoverage"
        pc = WCSProviderCheck(url, coverage, self.aoi_geojson)

        invalid_content = ""
        empty_content = """<wcs:WCS_Capabilities xmlns:gml="http://www.opengis.net/gml" xmlns:wcs="http://www.opengis.net/wcs">
                               <wcs:ContentMetadata>
                               </wcs:ContentMetadata>
                           </wcs:WCS_Capabilities>"""
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
                                  </wcs:WCS_Capabilities>"""
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
                           </wcs:WCS_Capabilities>"""

        self.check_ows(get, pc, invalid_content, empty_content, no_intersect_content, valid_content)

    @patch('eventkit_cloud.utils.provider_check.requests.get')
    def test_check_wms(self, get):
        url = "http://example.com/wms?"
        layer = "exampleLayer"
        pc = WMSProviderCheck(url, layer, self.aoi_geojson)

        invalid_content = ""
        empty_content = """<WMT_MS_Capabilities version="1.1.1">
                               <Capability>
                               </Capability>
                           </WMT_MS_Capabilities>"""

        no_intersect_content = """<WMT_MS_Capabilities version="1.1.1">
                                      <Capability>
                                          <Layer>
                                              <Layer>
                                                  <Name>exampleLayer</Name>
                                                  <LatLonBoundingBox minx="10" miny="10" maxx="11" maxy="11"/>
                                              </Layer>
                                          </Layer>
                                      </Capability>
                                  </WMT_MS_Capabilities>"""

        valid_content = """<WMT_MS_Capabilities version="1.1.1">
                               <Capability>
                                   <Layer>
                                       <Name>exampleLayer</Name>
                                       <LatLonBoundingBox minx="-1" miny="-1" maxx="1" maxy="1"/>
                                   </Layer>
                               </Capability>
                           </WMT_MS_Capabilities>"""

        self.check_ows(get, pc, invalid_content, empty_content, no_intersect_content, valid_content)


