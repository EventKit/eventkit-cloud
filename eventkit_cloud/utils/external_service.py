from __future__ import absolute_import

from datetime import datetime
from time import sleep
from mapproxy.script.conf.app import config_command
from mapproxy.seed.seeder import seed
from mapproxy.seed.config import SeedingConfiguration, SeedConfigurationError, ConfigurationError
from mapproxy.seed.spec import validate_seed_conf
from mapproxy.config.loader import ProxyConfiguration
from mapproxy.config.spec import validate_options
from mapproxy.config.config import load_config, base_config
from mapproxy.seed import seeder
from mapproxy.seed.util import ProgressLog
from mapproxy.seed import util
import yaml
from django.core.files.temp import NamedTemporaryFile
import logging
import sys
from django.db import IntegrityError, connections
from django.conf import settings
from billiard import Process, Pipe
from ..tasks.task_process import TaskProcess

logger = logging.getLogger(__name__)


class CustomLogger(ProgressLog):
    def __init__(self, progress_tracker=None, *args, **kwargs):
        self.progress_tracker = progress_tracker
        super(CustomLogger, self).__init__(*args, **kwargs)
        # Log mapproxy status but allow a setting to reduce database writes.
        self.log_step_step = 1
        self.log_step_counter = self.log_step_step

    def log_step(self, progress):
        if progress.eta.eta():
            if self.progress_tracker:
                if self.log_step_counter == 0:
                    self.progress_tracker(progress=progress.progress * 100,
                                          estimated_finish=datetime.utcfromtimestamp(float(progress.eta.eta())))
                    self.log_step_counter = self.log_step_step
                self.log_step_counter = self.log_step_counter - 1
        super(CustomLogger, self).log_step(progress)


class ExternalRasterServiceToGeopackage(object):
    """
    Convert a External service to a geopackage.
    """

    def __init__(self, config=None, gpkgfile=None, bbox=None, service_url=None, layer=None, debug=None, name=None,
                 level_from=None, level_to=None, service_type=None, progress_tracker=None, task_uid=None):
        """
        Initialize the ExternalServiceToGeopackage utility.

        Args:
            gpkgfile: where to write the gpkg output
            debug: turn debugging on / off
        """
        self.gpkgfile = gpkgfile
        self.bbox = bbox
        self.service_url = service_url
        self.debug = debug
        self.name = name
        self.level_from = level_from
        self.level_to = level_to
        self.layer = layer
        self.config = config
        self.service_type = service_type
        self.progress_tracker = progress_tracker
        self.task_uid = task_uid

    def convert(self, ):
        """
        Convert external service to gpkg.
        """

        if self.config:
            conf_dict = yaml.load(self.config)
        else:
            conf_dict = create_conf_from_url(self.service_url)

        if not conf_dict.get('grids'):
            conf_dict['grids'] = {'webmercator': {'srs': 'EPSG:3857',
                                                  'tile_size': [256, 256],
                                                  'origin': 'nw'}}
        conf_dict['caches'] = get_cache_template(["{}_{}".format(self.layer, self.service_type)],
                                                 [grids for grids in conf_dict.get('grids')],
                                                 self.gpkgfile)
        # disable SSL cert checks
        conf_dict['globals'] = {'http': {'ssl_no_cert_checks': True}}

        # Add autoconfiguration to base_config
        mapproxy_config = base_config()
        load_config(mapproxy_config, config_dict=conf_dict)

        # Create a configuration object
        mapproxy_configuration = ProxyConfiguration(mapproxy_config, seed=seed, renderd=None)

        seed_dict = get_seed_template(bbox=self.bbox, level_from=self.level_from, level_to=self.level_to)
        # Create a seed configuration object
        seed_configuration = SeedingConfiguration(seed_dict, mapproxy_conf=mapproxy_configuration)
        logger.info("Beginning seeding to {}".format(self.gpkgfile))
        logger.error(conf_dict)
        logger.error(seed_dict)
        # Call seeder using billiard without daemon, because of limitations of running child processes in python.
        try:
            progress_logger = CustomLogger(verbose=True, progress_tracker=self.progress_tracker)
            task_process = TaskProcess(task_uid=self.task_uid)
            task_process.start_process(billiard=True, target=seeder.seed,
                        kwargs={"tasks": seed_configuration.seeds(['seed']),
                                "concurrency": 1,
                                "progress_logger": progress_logger})
        except Exception as e:
            logger.error("Export failed for url {}.".format(self.service_url))
            errors, informal_only = validate_options(mapproxy_config)
            if not informal_only:
                logger.error("MapProxy configuration failed.")
                logger.error("Using Configuration:")
                logger.error(mapproxy_config)
            errors, informal_only = validate_seed_conf(seed_dict)
            if not informal_only:
                logger.error("Mapproxy Seed failed.")
                logger.error("Using Seed Configuration:")
                logger.error(seed_dict)
                raise SeedConfigurationError('MapProxy seed configuration error  - {}'.format(', '.join(errors)))
            raise e
        finally:
            connections.close_all()
        return self.gpkgfile


def get_cache_template(sources, grids, geopackage):
    return {'cache': {
        "sources": sources,
        "meta_size": [1, 1],
        "cache": {
            "type": "geopackage",
            "filename": str(geopackage),
        },
        "grids": grids
    }}


def get_seed_template(bbox=[-180, -89, 180, 89], level_from=None, level_to=None):
    return {
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
                    'to': level_to or 10,
                    'from': level_from or 0
                },
                'caches': ['cache']
            }
        }
    }


def create_conf_from_url(service_url):
    temp_file = NamedTemporaryFile()
    params = ['--capabilities', service_url, '--output', temp_file.name, '--force']
    config_command(params)

    conf_dict = None
    try:
        conf_dict = yaml.load(temp_file)
    except yaml.YAMLError as exc:
        logger.error(exc)
    return conf_dict
