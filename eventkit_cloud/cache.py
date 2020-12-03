from django.core.cache import caches
from django.core.cache.backends.base import BaseCache


class FallbackCache(BaseCache):
    def __init__(self, config, params):  # NOQA BaseCache uses params but others use both.
        super().__init__(params)

    def add(self, *args, **kwargs):
        return get_cache().add(*args, **kwargs)

    def clear(self):
        return get_cache().clear()

    def close(self, *args, **kwargs):
        return get_cache().close(*args, **kwargs)

    def decr(self, *args, **kwargs):
        return get_cache().decr(*args, **kwargs)

    def decr_version(self, *args, **kwargs):
        return get_cache().decr_version(*args, **kwargs)

    def delete(self, *args, **kwargs):
        return get_cache().delete(*args, **kwargs)

    def delete_many(self, *args, **kwargs):
        return get_cache().delete_many(*args, **kwargs)

    def get(self, *args, **kwargs):
        return get_cache().get(*args, **kwargs)

    def get_backend_timeout(self, *args, **kwargs):
        return get_cache().get_backend_timeout(*args, **kwargs)

    def get_many(self, *args, **kwargs):
        return get_cache().get_many(*args, **kwargs)

    def get_or_set(self, *args, **kwargs):
        return get_cache().get_or_set(*args, **kwargs)

    def has_key(self, *args, **kwargs):
        return get_cache().has_key(*args, **kwargs)  # NOQA has_key deprecation warning doesn't apply here.

    def incr(self, *args, **kwargs):
        return get_cache().incr(*args, **kwargs)

    def incr_version(self, *args, **kwargs):
        return get_cache().incr_version(*args, **kwargs)

    def make_key(self, *args, **kwargs):
        return get_cache().make_key(*args, **kwargs)

    def set(self, *args, **kwargs):
        return get_cache().set(*args, **kwargs)

    def set_many(self, *args, **kwargs):
        return get_cache().set_many(*args, **kwargs)

    def touch(self, *args, **kwargs):
        return get_cache().touch(*args, **kwargs)

    def validate_key(self, *args, **kwargs):
        return get_cache().validate_key(*args, **kwargs)


def get_cache():
    if caches["primary_cache"].get("primary_cache"):
        return caches["primary_cache"]
    caches["primary_cache"].set("primary_cache", True)
    if caches["primary_cache"].get("primary_cache"):
        return caches["primary_cache"]

    return caches["fallback_cache"]
