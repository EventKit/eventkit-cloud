
from eventkit_cloud.settings.prod import *  # NOQA

# Override settings here for test purposes.

CELERY_ALWAYS_EAGER = True
BROKER_BACKEND = 'memory'

PASSWORD_HASHERS = (
    'django.contrib.auth.hashers.MD5PasswordHasher',
)