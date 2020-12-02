import logging
from django.core.cache import caches
from django.core.cache.backends.base import BaseCache

logging.basicConfig()
logger = logging.getLogger(__name__)

# TODO: Should this be an environment variable?
DEFAULT_CACHE_EXPIRATION = 86400  # expire in a day


class FallbackCache(BaseCache):
    primary_cache = None
    fallback_cache = None

    def __init__(self, params=None, *args, **kwargs):
        BaseCache.__init__(self, *args, **kwargs)
        self.primary_cache = caches["primary_cache"]
        self.fallback_cache = caches["fallback_cache"]

    def call_with_fallback(self, method, *args, **kwargs):
        self.primary_cache.set("primary_cache", True)
        value = self.primary_cache.get("primary_cache")

        if value:
            logger.info(f"Using primary cache with method {method}, args {args} and kwargs {kwargs}.")
            return self.call_primary_cache(args, kwargs, method)
        else:
            logger.info(f"Switching to fallback cache because value is {value} method {method}, args {args} and kwargs {kwargs}.")
            return self.call_fallback_cache(args, kwargs, method)

    def call_primary_cache(self, args, kwargs, method):
        return getattr(self.primary_cache, method)(*args, **kwargs)

    def call_fallback_cache(self, args, kwargs, method):
        return getattr(self.fallback_cache, method)(*args, **kwargs)

    def add(self, key, value, timeout=None, version=None):
        return self.call_with_fallback("add", key, value, timeout=timeout, version=version)

    def get(self, key, default=None, version=None):
        return self.call_with_fallback("get", key, default=default, version=version)

    def touch(self, key, timeout=None, version=None):
        return self.call_with_fallback("touch", key, timeout=timeout, version=version)

    def set(self, key, value, timeout=None, version=None, client=None):
        return self.call_with_fallback("set", key, value, timeout=timeout, version=version)

    def delete(self, key, version=None):
        return self.call_with_fallback("delete", key, version=version)

    def get_many(self, key, version=None):
        return self.call_with_fallback("get_many", key, version=version)

    def get_or_set(self, key, default, timeout=None, version=None):
        return self.call_with_fallback("get_or_set", key, default, timeout=timeout, version=version)

    def clear(self):
        return self.call_with_fallback("clear")
