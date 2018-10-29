# -*- coding: utf-8 -*-


from eventkit_cloud.tasks.debug_tasks import *
from eventkit_cloud.tasks.export_tasks import *
from eventkit_cloud.tasks.scheduled_tasks import *
from django.core.cache import cache

default_app_config = 'eventkit_cloud.tasks.apps.EventKitTasks'

DEFAULT_CACHE_EXPIRTATION = 86400  # expire in a day


def get_cache_key(obj=None, attribute=None, uid=None, model_type=None):
    """
    A way to store values in the cache ideally models would use their own record
    :param obj:
    :param attribute:
    :param uid:
    :param model_type:
    :return:
    """
    if obj:
        uid = obj.uid
    else:
        uid = uid
    return "{}.{}.{}".format(str(uid), attribute)


def set_cache_value(uid, attribute, value, expiration=DEFAULT_CACHE_EXPIRTATION):
    return cache.set(get_cache_key(attribute=attribute, uid=str(uid)), value, expiration)


def get_cache_value(uid, attribute):
    return cache.get(get_cache_key(attribute=attribute, uid=str(uid)))
