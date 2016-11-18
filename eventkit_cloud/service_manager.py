from __future__ import absolute_import

from mapproxy.script.conf.app import config_command
import yaml
from django.core.files.temp import NamedTemporaryFile
import logging
import sys
from .voyagersearch import export_voyager_data
from django.db import IntegrityError
from django.conf import settings

log = logging.getLogger(__name__)


def create_conf_from_wms(wms_url, name="Eventkit", bbox=None):
    temp_file = NamedTemporaryFile()
    # wms_url = wms_url.replace('"','')
    params = ['--capabilities', wms_url, '--output', temp_file.name, '--force']
    config_command(params)

    conf_dict = None
    try:
        conf_dict = yaml.load(temp_file)
    except yaml.YAMLError as exc:
        log.error(exc)
    # Need function to load mapproxy yaml


def create_confs_from_voyager(service_list, base_url, bbox=None):
    service_list = export_voyager_data(service_list, base_url)
    for service in service_list:
        if 'wms' in service.get('format'):
            if not service.get('url'):
                return
            create_conf_from_wms(service.get('url'), name=service.get('title'))


def get_layers(layers):
    layer_list = []
    for layer in layers:
        if isinstance(layer, dict) and layer.get('layers'):
            layer_list += get_layers(layer.get('layers'))
        else:
            layer_list += [layer]
    return layer_list
