from __future__ import absolute_import

from mapproxy.script.conf.app import config_command
import yaml
from django.core.files.temp import NamedTemporaryFile
import logging
import sys
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


def get_layers(layers):
    layer_list = []
    for layer in layers:
        if isinstance(layer, dict) and layer.get('layers'):
            layer_list += get_layers(layer.get('layers'))
        else:
            layer_list += [layer]
    return layer_list
