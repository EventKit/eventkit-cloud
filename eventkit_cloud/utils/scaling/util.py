import json
import os

from django.conf import settings

from eventkit_cloud.utils.scaling import Docker, Pcf
from eventkit_cloud.utils.scaling.dummy import Dummy


def get_scale_client():
    if os.getenv("DEBUG_CELERY"):
        return Dummy(), "Dummy"
    elif os.getenv("PCF_SCALING"):
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
