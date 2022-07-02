from eventkit_cloud.settings.prod import *  # NOQA

# Override settings here for test purposes.
TESTING = True
CELERY_ALWAYS_EAGER = True
BROKER_BACKEND = "memory"

PASSWORD_HASHERS = ("django.contrib.auth.hashers.MD5PasswordHasher",)

CACHES = {
    "default": {"BACKEND": "eventkit_cloud.utils.fallback_cache.FallbackCache"},
    "primary_cache": {
        "BACKEND": "django.core.cache.backends.filebased.FileBasedCache",
        "LOCATION": "/tmp/primary_cache",
    },
    "fallback_cache": {
        "BACKEND": "django.core.cache.backends.filebased.FileBasedCache",
        "LOCATION": "/tmp/fallback_cache",
    },
}
