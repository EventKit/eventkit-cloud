from __future__ import absolute_import

from datetime import datetime
from mapproxy.script.conf.app import config_command
from mapproxy.seed.seeder import seed
from mapproxy.seed.config import SeedingConfiguration, SeedConfigurationError
from mapproxy.seed.spec import validate_seed_conf
from mapproxy.config.loader import ProxyConfiguration, ConfigurationError, validate_references
from mapproxy.config.spec import validate_options

from mapproxy.config.config import load_config, base_config, load_default_config
from mapproxy.seed import seeder
from mapproxy.seed.util import ProgressLog
from django.conf import settings
import yaml
from django.core.files.temp import NamedTemporaryFile
import logging
from django.db import connections
import requests
from pysqlite2 import dbapi2 as sqlite3
from .geopackage import (get_tile_table_names, get_zoom_levels_table,
                         get_table_tile_matrix_information, set_gpkg_contents_bounds)

logger = logging.getLogger(__name__)

class CustomLogger(ProgressLog):

    def __init__(self, task_uid=None, *args, **kwargs):

        self.task_uid = task_uid
        super(CustomLogger, self).__init__(*args, **kwargs)
        # Log mapproxy status but allow a setting to reduce database writes.
        self.log_step_step = 1
        self.log_step_counter = self.log_step_step

    def log_step(self, progress):
        from ..tasks.export_tasks import update_progress
        if self.task_uid:
            if self.log_step_counter == 0:
                update_progress(self.task_uid, progress=progress.progress * 100)
                self.log_step_counter = self.log_step_step
            self.log_step_counter -= 1
        super(CustomLogger, self).log_step(progress)


class ExternalRasterServiceToGeopackage(object):
    """
    Convert a External service to a geopackage.
    """

    def __init__(self, config=None, gpkgfile=None, bbox=None, service_url=None, layer=None, debug=None, name=None,
                 level_from=None, level_to=None, service_type=None, task_uid=None, selection=None):
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
        self.task_uid = task_uid
        self.selection = selection

    def build_config(self):
        pass

    def get_check_config(self):
        """
        Create a MapProxy configuration object and verifies its validity
        """
        if self.config:
            conf_dict = yaml.load(self.config)
        else:
            conf_dict = create_conf_from_url(self.service_url)

        if not conf_dict.get('grids'):
            conf_dict['grids'] = {'geodetic': {'srs': 'EPSG:4326',
                                               'tile_size': [256, 256],
                                               'origin': 'nw'},
                                  'webmercator': {'srs': 'EPSG:3857',
                                                  'tile_size': [256, 256],
                                                  'origin': 'nw'}}

        # If user provides a cache setup then use that and substitute in the geopackage file for the placeholder.
        conf_dict['caches'] = conf_dict.get('caches', {})
        try:
            conf_dict['caches']['cache']['cache']['filename'] = self.gpkgfile
        except KeyError:
            conf_dict['caches']['cache'] = get_cache_template(["{0}_{1}".format(self.layer, self.service_type)],
                                                              [grids for grids in conf_dict.get('grids')],
                                                              self.gpkgfile, table_name=self.layer)

        conf_dict['services'] = ['demo']

        # Prevent the service from failing if source has missing tiles.
        for source in conf_dict.get('sources') or []:
            if 'wmts' in source:
                conf_dict['sources'][source]['transparent'] = True
                conf_dict['sources'][source]['on_error'] = {"other": {"response": "transparent", "cache": False}}

        # disable SSL cert checks
        if getattr(settings, "DISABLE_SSL_VERIFICATION", False):
            conf_dict['globals'] = {'http': {'ssl_no_cert_checks': True}}

        # Add autoconfiguration to base_config
        # default = load_default_config()
        mapproxy_config = load_default_config()
        load_config(mapproxy_config, config_dict=conf_dict)

        # Create a configuration object
        mapproxy_configuration = ProxyConfiguration(mapproxy_config, seed=seed, renderd=None)

        # # As of Mapproxy 1.9.x, datasource files covering a small area cause a bbox error.
        if self.bbox:
            if isclose(self.bbox[0], self.bbox[2], rel_tol=0.001) or isclose(self.bbox[0], self.bbox[2], rel_tol=0.001):
                logger.warn('Using bbox instead of selection, because the area is too small')
                self.selection = None

        seed_dict = get_seed_template(bbox=self.bbox, level_from=self.level_from, level_to=self.level_to,
                                      coverage_file=self.selection)

        # Create a seed configuration object
        seed_configuration = SeedingConfiguration(seed_dict, mapproxy_conf=mapproxy_configuration)

        errors = validate_references(conf_dict)
        if errors:
            logger.error("MapProxy configuration failed.")
            logger.error("Using Configuration:")
            logger.error(conf_dict)
            raise ConfigurationError("MapProxy returned the error - {0}".format(", ".join(errors)))

        return conf_dict, seed_configuration, mapproxy_configuration

    def convert(self,):
        """
        Convert external service to gpkg.
        """

        from ..tasks.task_process import TaskProcess
        from .geopackage import remove_empty_zoom_levels

        conf_dict, seed_configuration, mapproxy_configuration = self.get_check_config()

        logger.info("Beginning seeding to {0}".format(self.gpkgfile))
        try:
            check_service(conf_dict)
            progress_logger = CustomLogger(verbose=True, task_uid=self.task_uid)
            task_process = TaskProcess(task_uid=self.task_uid)
            task_process.start_process(billiard=True, target=seeder.seed,
                                       kwargs={"tasks": seed_configuration.seeds(['seed']),
                                               "concurrency": int(getattr(settings, 'MAPPROXY_CONCURRENCY', 1)),
                                               "progress_logger": progress_logger})
            check_zoom_levels(self.gpkgfile, mapproxy_configuration)
            remove_empty_zoom_levels(self.gpkgfile)
            set_gpkg_contents_bounds(self.gpkgfile, self.layer, self.bbox)
            if task_process.exitcode != 0:
                raise Exception("The Raster Service failed to complete, please contact an administrator.")
        except Exception:
            logger.error("Export failed for url {}.".format(self.service_url))
            raise
        finally:
            connections.close_all()
        return self.gpkgfile


def get_cache_template(sources, grids, geopackage, table_name='tiles'):
    """
    Returns the cache template which is "controlled" settings for the application.

    The intent is to allow the user to configure certain things but impose specific behavior.
    :param sources: A name for the source
    :param grids: specific grid for the data source
    :param geopackage: Location for the geopackage
    :return: The dict template
    """
    return {
        "sources": sources,
        "meta_size": [1, 1],
        "cache": {
            "type": "geopackage",
            "filename": str(geopackage),
            "table_name": table_name or 'None'
        },
        "grids": [grid for grid in grids if grid == 'geodetic'] or grids,
        "format": "mixed",
        "request_format": "image/png"
    }


def get_seed_template(bbox=None, level_from=None, level_to=None, coverage_file=None):
    bbox = bbox or [-180, -89, 180, 89]
    seed_template = {
        'coverages': {
            'geom': {
                'srs': 'EPSG:4326',
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

    if coverage_file:
        seed_template['coverages']['geom']['datasource'] = str(coverage_file)
    else:
        seed_template['coverages']['geom']['bbox'] = bbox

    return seed_template


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


def check_service(conf_dict):
    """
    Used to verify the state of the service before running the seed task. This is used to prevent an invalid url from
    being seeded.  MapProxy's default behavior is to either cache a blank tile or to retry, that behavior can be altered,
    in the cache settings (i.e. `get_cache_template`).
    :param conf_dict: A MapProxy configuration as a dict.
    :return: None if valid, otherwise exception is raised.
    """

    for source in conf_dict.get('sources', []):
        if not conf_dict['sources'][source].get('url'):
            continue
        tile = {'x': '1', 'y': '1', 'z': '1'}
        url = conf_dict['sources'][source].get('url') % tile
        response = requests.get(url, verify=False)
        if response.status_code in [401, 403]:
            logger.error("The provider has invalid credentials with status code {0} and the text: \n{1}".format(
                response.status_code, response.text))
            raise Exception("The provider does not have valid credentials.")
        elif response.status_code >= 500:
            logger.error("The provider reported a server error with status code {0} and the text: \n{1}".format(
                response.status_code, response.text))
            raise Exception("The provider reported a server error.")


def isclose(a, b, rel_tol=1e-09, abs_tol=0.0):
    return abs(a - b) <= max(rel_tol * max(abs(a), abs(b)), abs_tol)


def check_zoom_levels(gpkg, mapproxy_configuration):

    try:
        grid = mapproxy_configuration.caches.get('cache').conf.get('grids')[0]
        tile_size = mapproxy_configuration.grids.get(grid).conf.get('tile_size')
        tile_grid = mapproxy_configuration.grids.get(grid).tile_grid()
        for table_name in get_tile_table_names(gpkg):
            actual_zoom_levels = get_zoom_levels_table(gpkg, table_name)
            gpkg_tile_matrix = get_table_tile_matrix_information(gpkg, table_name)
            for actual_zoom_level in actual_zoom_levels:
                if actual_zoom_level not in [level.get('zoom_level') for level in gpkg_tile_matrix]:
                    res = tile_grid.resolution(actual_zoom_level)
                    grid_sizes = tile_grid.grid_sizes[actual_zoom_level]
                    with sqlite3.connect(gpkg) as conn:
                        conn.execute("""
INSERT OR REPLACE INTO gpkg_tile_matrix (table_name, zoom_level, matrix_width, matrix_height, tile_width, tile_height, pixel_x_size, pixel_y_size) 
VALUES(?, ?, ?, ?, ?, ?, ?, ?)""", (table_name, actual_zoom_level, grid_sizes[0], grid_sizes[1], tile_size[0], tile_size[1], res, res))
    except Exception as e:
        logger.error('Problem in check_zoom_levels: {}'.format(e))
