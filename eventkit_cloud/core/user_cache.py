from multiprocessing.sharedctypes import Value
from django.core.cache import cache


class UserCache:
    """
    Interacts with the caches related to username
    """

    def __init__(self, username: str, *arg, **kwargs):
        if not isinstance(username, str):
            raise Exception("UserCache should be created with a username")
        self.username = username

    def _get_cache_keys(self) -> list:
        return cache.get(self.username, [])

    def _add_cache_key(self, key):
        cache_keys: list = self._get_cache_keys()
        try:
            cache_keys.index(key)
        except ValueError:
            cache_keys.append(key)
            cache.set(self.username, cache_keys)
        return cache_keys.append(key)

    def _remove_cache_key(self, key):
        cache_keys: list = self._get_cache_keys()
        try:
            cache_keys.remove(key)
            cache.set(self.username, cache_keys)
        except ValueError:
            # No need to reset cache, nothing changed
            pass
        return cache_keys.remove(key)

    def add(self, key, *args, **kwargs):
        # print("add user cache item")
        self._add_cache_key(key)
        return cache.add(key, *args, **kwargs)

    def delete(self, key, *arg, **kwargs):
        # print("remove user cache item")
        delete = cache.delete(key, *arg, **kwargs)
        if delete:
            self._remove_cache_key(key)
        return delete

    def get(self, key, *args, **kwargs):
        # print("get user cache item")
        return cache.get(key, *args, **kwargs)

    def set(self, key, *args, **kwargs):
        # print("set user cache item")
        return cache.set(key, *args, **kwargs)
