# -*- coding: utf-8 -*-
import logging

from django.test import TestCase

import os
from mock import Mock, patch, call
from ..helpers import cd, get_style_files, get_file_paths

logger = logging.getLogger(__name__)


class TestHelpers(TestCase):

    def test_cd(self):
        current_path = os.getcwd()
        parent_path = os.path.dirname(current_path)
        with cd(parent_path):
            self.assertEquals(parent_path, os.getcwd())
        self.assertEquals(current_path, os.getcwd())

    def test_get_style_files(self):
        for file in get_style_files():
            self.assertTrue(os.path.isfile(file))

    def test_get_file_paths(self):
        self.assertTrue(os.path.abspath(__file__) in get_file_paths(os.path.dirname(__file__)))