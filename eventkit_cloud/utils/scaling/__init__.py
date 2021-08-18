import json
import os

from django.conf import settings

from eventkit_cloud.utils.scaling.docker import Docker
from eventkit_cloud.utils.scaling.pcf import Pcf


def get_scale_client():
    if os.getenv("PCF_SCALING"):
        client = Pcf()
        client.login()
        if os.getenv("CELERY_TASK_APP"):
            app_name = os.getenv("CELERY_TASK_APP")
        else:
            app_name = json.loads(os.getenv("VCAP_APPLICATION", "{}")).get("application_name")
    else:
        client = Docker()
        app_name = settings.DOCKER_IMAGE_NAME

    return client, app_name


class ScaleLimitError(Exception):
    """Raise when the application couldn't scale for all needed jobs."""

    pass
