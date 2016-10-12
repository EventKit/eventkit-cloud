from __future__ import absolute_import

from dateutil import parser
from time import sleep
from mapproxy.script.conf.app import config_command
from mapproxy.seed.seeder import seed
from mapproxy.seed.config import SeedingConfiguration, SeedConfigurationError, ConfigurationError
from mapproxy.seed.spec import validate_seed_conf
from mapproxy.config.loader import ProxyConfiguration
from mapproxy.config.spec import validate_options
from mapproxy.config.config import load_config, base_config
from mapproxy.seed import seeder
from mapproxy.seed import util
import yaml
from django.core.files.temp import NamedTemporaryFile
import logging
import sys
from django.db import IntegrityError
from django.conf import settings
from billiard import Process

logger = logging.getLogger(__name__)


class WFSToGeopackage():
    """
    Convert a WFS services to a geopackage.
    """

    def __init__(self, config=None, gpkgfile=None, bbox=None, wmts_url=None, layer=None, debug=None, name=None, level_from=None, level_to=None):
        """
        Initialize the WFSToGeopackage utility.

        Args:
            gpkgfile: where to write the gpkg output
            debug: turn debugging on / off
        """
        self.gpkgfile = gpkgfile
        self.bbox = bbox
        self.wmts_url = wmts_url
        self.debug = debug
        self.name = name
        self.level_from = level_from
        self.level_to = level_to
        self.layer = layer
        self.config = config

    def convert(self, ):
        """
        Convert wfs to gpkg.
        """
        return 