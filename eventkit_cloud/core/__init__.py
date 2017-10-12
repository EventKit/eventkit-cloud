import os
from django.conf import settings

if not os.path.isdir(settings.EXPORT_STAGING_ROOT):
    os.makedirs(settings.EXPORT_STAGING_ROOT)