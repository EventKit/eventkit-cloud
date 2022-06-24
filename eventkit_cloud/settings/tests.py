from eventkit_cloud.settings.prod import *  # NOQA

# Override settings here for test purposes.
TESTING = True
CELERY_ALWAYS_EAGER = True
BROKER_BACKEND = "memory"

PASSWORD_HASHERS = ("django.contrib.auth.hashers.MD5PasswordHasher",)
CACHES = {"default": {
    'BACKEND': 'django.core.cache.backends.filebased.FileBasedCache',
    'LOCATION': '/tmp/django_cache',
}}
