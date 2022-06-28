import json
import os
from typing import Union

from django.conf import settings

from eventkit_cloud.utils.scaling import Docker, Pcf


def get_scale_client():
    client: Union[Pcf, Docker]
    if os.getenv("PCF_SCALING"):
        pcf_client = Pcf()
        pcf_client.login()
        if os.getenv("CELERY_TASK_APP"):
            app_name = os.getenv("CELERY_TASK_APP")
        else:
            app_name = json.loads(os.getenv("VCAP_APPLICATION", "{}")).get("application_name")
        client = pcf_client
    else:
        client = Docker()
        app_name = settings.DOCKER_IMAGE_NAME

    return client, app_name
