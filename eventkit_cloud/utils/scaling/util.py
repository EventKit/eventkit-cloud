import json
import os
from typing import Union

from django.conf import settings

from eventkit_cloud.utils.scaling import Docker, Dummy, Pcf


def get_scale_client():

    client: Union[Pcf, Docker]
    if settings.DEBUG_CELERY:  # type: ignore  # issue with django-stubs
        return Dummy(), "Dummy"
    elif settings.PCF_SCALING:  # type: ignore  # issue with django-stubs
        client = Pcf()

        if settings.CELERY_TASK_APP:  # type: ignore  # issue with django-stubs
            app_name = settings.CELERY_TASK_APP  # type: ignore  # issue with django-stubs
        else:
            app_name = json.loads(os.getenv("VCAP_APPLICATION", "{}")).get("application_name")
    else:
        client = Docker()
        app_name = settings.DOCKER_IMAGE_NAME

    return client, app_name
