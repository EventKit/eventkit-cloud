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


class WMSToGeopackage():
    """
    Convert a WMS services to a geopackage.
    """

    def __init__(self, gpkgfile=None, bbox=None, wms_url=None, debug=None, name=None):
        """
        Initialize the SQliteToKml utility.

        Args:
            gpkgfile: where to write the gpkg output
            debug: turn debugging on / off
        """
        self.gpkgfile = gpkgfile
        self.bbox = bbox
        self.wms_url = wms_url
        self.debug = debug
        self.name = name

    def convert(self, ):
        """
        Convert sqlite to gpkg.
        """
        conf_dict = create_conf_from_wms(self.wms_url)
        sources = []
        for source in conf_dict.get('sources'):
            sources.append(source)

        mapproxy_config = base_config()

        # Add autoconfiguration
        load_config(mapproxy_config, config_dict=conf_dict)

        errors, informal_only = validate_options(mapproxy_config)
        if not informal_only:
            raise ConfigurationError('invalid configuration - {}'.format(', '.join(errors)))

        mapproxy_configuration = ProxyConfiguration(mapproxy_config, seed=seed, renderd=None)

        seed_dict = get_seed_template
        errors, informal_only = validate_seed_conf(seed_dict)
        if not informal_only:
            raise SeedConfigurationError('invalid seed configuration - {}'.format(', '.join(errors)))
        seed_configuration = SeedingConfiguration(seed_dict, mapproxy_conf=mapproxy_configuration)

        try:
            p = Process(target=seeder.seed, daemon=False, kwargs={"tasks": seed_configuration.seeds(['seed'])})
            p.start()
            p.join()
        except Exception as e:
            logger.error("wms failed.")
            raise e
        return self.gpkgfile


def get_cache_template(sources, geopackage):
    return {'cache': {
            "sources": sources,
            "cache": {
                "type": "geopackage",
                "filename": str(geopackage)
            },
            "grids": ["GLOBAL_WEBMERCATOR"]
        }}

def get_seed_template(bbox=[-180,-89,180,89], level_from=0, level_to=12):
    {
        'coverages': {
            'geom': {
                'srs': 'EPSG:4326',
                'bbox': bbox
            }
        },
        'seeds': {
            'seed': {
                'coverages': ['geom'],
                'refresh_before': {
                    'minutes': 0
                },
                'levels': {
                    'to': level_to,
                    'from': level_from
                },
                'caches': ['cache']
            }
        }
    }


def create_conf_from_wms(wms_url):
    temp_file = NamedTemporaryFile()
    # wms_url = wms_url.replace('"','')
    params = ['--capabilities', wms_url, '--output', temp_file.name, '--force']
    config_command(params)

    conf_dict = None
    try:
        conf_dict = yaml.load(temp_file)
    except yaml.YAMLError as exc:
        logger.error(exc)
    return conf_dict


