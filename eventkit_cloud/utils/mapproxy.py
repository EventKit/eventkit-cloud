

import logging

import yaml
from django.conf import settings
from django.db import connections
import mapproxy
from mapproxy.cache.geopackage import GeopackageCache
from mapproxy.config.config import load_config, load_default_config
from mapproxy.config.loader import ProxyConfiguration, ConfigurationError, validate_references
from mapproxy.seed import seeder
from mapproxy.seed.config import SeedingConfiguration
from mapproxy.seed.util import ProgressLog, exp_backoff, timestamp, ProgressStore

import os
import sqlite3
import time

from eventkit_cloud.utils import auth_requests
from eventkit_cloud.utils.geopackage import get_tile_table_names, set_gpkg_contents_bounds, \
    get_table_tile_matrix_information, get_zoom_levels_table, remove_empty_zoom_levels
from eventkit_cloud.utils.gdalutils import retry
from eventkit_cloud.utils.stats.eta_estimator import ETA


logger = logging.getLogger(__name__)


class CustomLogger(ProgressLog):

    def __init__(self, task_uid=None, *args, **kwargs):
        self.task_uid = task_uid
        super(CustomLogger, self).__init__(*args, **kwargs)
        # Log mapproxy status but allow a setting to reduce database writes.
        self.log_step_step = 1
        self.log_step_counter = self.log_step_step
        self.eta = ETA(task_uid=task_uid)

    def log_step(self, progress):
        from eventkit_cloud.tasks.export_tasks import update_progress
        self.eta.update(progress.progress)  # This may also get called by update_progress but because update_progress
                                            # is rate-limited; we also do it here to get more data points for making
                                            # better eta estimates

        if self.task_uid:
            if self.log_step_counter == 0:
                update_progress(self.task_uid, progress=progress.progress * 100, eta=self.eta)
                self.log_step_counter = self.log_step_step
            self.log_step_counter -= 1

        # Old version of super.log_step that includes ETA string
        # https://github.com/mapproxy/mapproxy/commit/93bc53a01318cd63facdb4ee13968caa847a5c17
        if not self.verbose:
            return
        if (self._laststep + .5) < time.time():
            # log progress at most every 500ms
            self.out.write('[%s] %6.2f%%\t%-20s ETA: %s\r' % (
                timestamp(), progress.progress*100, progress.progress_str,
                self.eta
            ))
            self.out.flush()
            self._laststep = time.time()


def get_custom_exp_backoff(max_repeat=None):

    def custom_exp_backoff(*args, **kwargs):
        if max_repeat:
            kwargs['max_repeat'] = max_repeat
        exp_backoff(*args, **kwargs)

    return custom_exp_backoff


# This is a bug in mapproxy, https://github.com/mapproxy/mapproxy/issues/387
def load_tile_metadata(self, tile):
    if not self.supports_timestamp:
        # GPKG specification does not include timestamps.
        # This sets the timestamp of the tile to epoch (1970s)
        tile.timestamp = -1
    else:
        self.load_tile(tile)


class MapproxyGeopackage(object):
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
            raise ConfigurationError("MapProxy configuration is required for raster data providers")

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
            conf_dict['caches']['cache'] = get_cache_template(["{0}".format(self.layer)],
                                                              [grids for grids in conf_dict.get('grids')],
                                                              self.gpkgfile, table_name=self.layer)

        # Need something listed as a service to pass the mapproxy validation.
        conf_dict['services'] = ['demo']

        # disable SSL cert checks
        ssl_verify = getattr(settings, "SSL_VERIFICATION", True)
        if not ssl_verify:
            conf_dict['globals'] = {'http': {'ssl_no_cert_checks': True}}

        # Add autoconfiguration to base_config
        # default = load_default_config()
        mapproxy_config = load_default_config()
        load_config(mapproxy_config, config_dict=conf_dict)

        # Create a configuration object
        mapproxy_configuration = ProxyConfiguration(mapproxy_config, seed=seeder.seed, renderd=None)

        # # As of Mapproxy 1.9.x, datasource files covering a small area cause a bbox error.
        if self.bbox:
            if isclose(self.bbox[0], self.bbox[2], rel_tol=0.001) or isclose(self.bbox[0], self.bbox[2], rel_tol=0.001):
                logger.warning('Using bbox instead of selection, because the area is too small')
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

    @retry
    def convert(self,):
        """
        Convert external service to gpkg.
        """

        from eventkit_cloud.tasks.task_process import TaskProcess
        conf_dict, seed_configuration, mapproxy_configuration = self.get_check_config()
        #  Customizations...
        mapproxy.seed.seeder.exp_backoff = get_custom_exp_backoff(max_repeat=int(conf_dict.get('max_repeat', 5)))
        mapproxy.cache.geopackage.GeopackageCache.load_tile_metadata = load_tile_metadata
        logger.info("Beginning seeding to {0}".format(self.gpkgfile))
        try:
            auth_requests.patch_https(self.name)
            auth_requests.patch_mapproxy_opener_cache(slug=self.name)

            progress_store = get_progress_store(self.gpkgfile)
            progress_logger = CustomLogger(verbose=True, task_uid=self.task_uid, progress_store=progress_store)

            task_process = TaskProcess(task_uid=self.task_uid)
            task_process.start_process(billiard=True, target=seeder.seed,
                                       kwargs={"tasks": seed_configuration.seeds(['seed']),
                                               "concurrency": get_concurrency(conf_dict),
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


def get_progress_store(gpkg):
    progress_file = os.path.join(os.path.dirname(gpkg), '.progress_logger')
    return ProgressStore(filename=progress_file, continue_seed=True)


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


def get_concurrency(conf_dict):
    concurrency = conf_dict.get('concurrency')
    if not concurrency:
        concurrency = getattr(settings, 'MAPPROXY_CONCURRENCY', 1)
    return int(concurrency)
