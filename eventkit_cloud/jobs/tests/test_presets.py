# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from StringIO import StringIO
import json
import logging
import os

from django.conf import settings
from django.contrib.auth.models import Group, User
from django.contrib.gis.geos import GEOSGeometry, Polygon
from django.core.files import File
from django.core.files.base import ContentFile
from django.test import TestCase

from lxml import etree

from ..models import ExportConfig, ExportFormat, Job, DatamodelPreset
from ..presets import PresetParser, UnfilteredPresetParser


logger = logging.getLogger(__name__)


class TestPresetParser(TestCase):
    def setUp(self,):
        self.path = os.path.dirname(os.path.realpath(__file__))

    def test_parse_preset(self,):
        parser = PresetParser(self.path + '/files/hdm_presets.xml')
        tags = parser.parse()
        self.assertIsNotNone(tags)
        self.assertEquals(238, len(tags))

    def test_as_simplified_json(self):
        parser = PresetParser(self.path + '/files/hdm_presets.xml')
        json_tags = parser.as_simplified_json()
        tags = json.loads(json_tags)

    def test_validate_hdm_presets(self,):
        schema = StringIO(open(self.path + '/files/tagging-preset.xsd').read())
        xmlschema_doc = etree.parse(schema)
        xmlschema = etree.XMLSchema(xmlschema_doc)
        xml = StringIO(open(self.path + '/files/hdm_presets.xml').read())
        tree = etree.parse(xml)
        valid = xmlschema.validate(tree)
        self.assertTrue(valid)

    def test_validate_osm_presets(self,):
        schema = StringIO(open(self.path + '/files/tagging-preset.xsd').read())
        xmlschema_doc = etree.parse(schema)
        xmlschema = etree.XMLSchema(xmlschema_doc)
        xml = StringIO(open(self.path + '/files/osm_presets.xml').read())
        tree = etree.parse(xml)
        valid = xmlschema.validate(tree)
        self.assertTrue(valid)

    def test_validate_custom_preset(self,):
        schema = StringIO(open(self.path + '/files/tagging-preset.xsd').read())
        xmlschema_doc = etree.parse(schema)
        xmlschema = etree.XMLSchema(xmlschema_doc)
        xml = StringIO(open(self.path + '/files/custom_preset.xml').read())
        tree = etree.parse(xml)
        valid = xmlschema.validate(tree)
        self.assertTrue(valid)

    def test_build_hdm_preset_dict(self,):
        parser = PresetParser(self.path + '/files/hdm_presets.xml')
        parser.build_hdm_preset_dict()

    def test_build_osm_preset_dict(self,):
        parser = PresetParser(self.path + '/files/osm_presets.xml')
        parser.build_hdm_preset_dict()


class TestUnfilteredPresetParser(TestCase):
    fixtures = ('datamodel_presets.json',)

    def setUp(self,):
        self.path = os.path.dirname(os.path.realpath(__file__))
        self.formats = ExportFormat.objects.all()  # pre-loaded by 'insert_export_formats' migration
        Group.objects.create(name='TestDefaultExportExtentGroup')
        self.user = User.objects.create(username='demo', email='demo@demo.com', password='demo')
        bbox = Polygon.from_bbox((-7.96, 22.6, -8.14, 27.12))
        the_geom = GEOSGeometry(bbox, srid=4326)
        self.job = Job.objects.create(name='TestJob', description='Test description',
                                      event='Nepal activation', user=self.user, the_geom=the_geom)
        self.uid = self.job.uid
        # add the formats to the job
        self.job.formats = self.formats
        self.job.save()

    def test_parse_preset(self,):
        parser = UnfilteredPresetParser(self.path + '/files/hdm_presets.xml')
        tags = parser.parse()
        self.assertIsNotNone(tags)
        self.assertEquals(233, len(tags))

    def test_validate_hdm_presets(self,):
        schema = StringIO(open(self.path + '/files/tagging-preset.xsd').read())
        xmlschema_doc = etree.parse(schema)
        xmlschema = etree.XMLSchema(xmlschema_doc)
        xml = StringIO(open(self.path + '/files/hdm_presets.xml').read())
        tree = etree.parse(xml)
        valid = xmlschema.validate(tree)
        self.assertTrue(valid)

    def test_validate_osm_presets(self,):
        schema = StringIO(open(self.path + '/files/tagging-preset.xsd').read())
        xmlschema_doc = etree.parse(schema)
        xmlschema = etree.XMLSchema(xmlschema_doc)
        xml = StringIO(open(self.path + '/files/osm_presets.xml').read())
        tree = etree.parse(xml)
        valid = xmlschema.validate(tree)
        self.assertTrue(valid)

    def test_build_hdm_preset_dict(self,):
        parser = UnfilteredPresetParser(self.path + '/files/hdm_presets.xml')
        parser.build_hdm_preset_dict()

    def test_build_osm_preset_dict(self,):
        parser = UnfilteredPresetParser(self.path + '/files/osm_presets.xml')
        parser.build_hdm_preset_dict()

    def test_save_tags(self,):
        tags = DatamodelPreset.objects.get(name='hdm').json_tags
        self.assertIsNotNone(tags)
        self.assertEquals(271, len(tags))
        self.job.json_tags = tags
        self.job.save()
        self.assertEquals(271, len(self.job.json_tags))
