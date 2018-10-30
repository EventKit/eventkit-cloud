# -*- coding: utf-8 -*-


from eventkit_cloud.tasks.debug_tasks import *
from eventkit_cloud.tasks.export_tasks import *
from eventkit_cloud.tasks.scheduled_tasks import *
from django.core.cache import cache
from django.apps import apps as django_apps

default_app_config = 'eventkit_cloud.tasks.apps.EventKitTasks'

DEFAULT_CACHE_EXPIRTATION = 86400  # expire in a day


def get_cache_key(obj=None, attribute=None, uid=None, model_name=None):
    """
    A way to store values in the cache ideally models would use their own implementation of this, but this could
    be called directly to prevent the need to call the model to update the state.

    Example
    :param obj: A string representing a model name (i.e. ExportTaskRecord)
    :param attribute: The models attribute.
    :param uid: An optional uid if a specific object isn't passed.
    :param model_name: An obtional model_name if an object isn't passed.
    :return:
    """
    if obj:
        uid = obj.uid
        model_name = type(obj).__name__
    else:
        uid = uid
        try:
            model = django_apps.get_model('tasks', model_name)
            if not hasattr(model, attribute):
                raise Exception("{} does not have the attribute {}".format(model, attribute))
        except LookupError:
            logger.error("There is no such model {0}".format(model_name))
            raise
    return "{}.{}.{}".format(model_name, str(uid), attribute)


def set_cache_value(obj=None, uid=None, attribute=None, value=None,
                    model_name=None, expiration=DEFAULT_CACHE_EXPIRTATION):
    return cache.set(get_cache_key(obj=obj, attribute=attribute, uid=str(uid), model_name=model_name), value, expiration)


def get_cache_value(obj=None, uid=None, attribute=None, model_name=None):
    return cache.get(get_cache_key(obj=obj, attribute=attribute, uid=str(uid), model_name=model_name))
