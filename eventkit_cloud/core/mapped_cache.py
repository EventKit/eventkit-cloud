from django.core.cache import cache


class MappedCache:
    """
    Interacts with the caches related to root_key
    """

    def __init__(self, root_key: str, *arg, **kwargs):
        if not isinstance(root_key, str):
            raise Exception("MappedCache should be created with a root_key")
        self.root_key = root_key

    def get(self, key, *args, **kwargs):
        return cache.get(key, *args, **kwargs)

    def get_all(self, *args, **kwargs) -> list:
        return self._get_cache_keys()

    def add(self, key, value, *args, **kwargs):
        self._add_cache_key(key)
        return cache.add(key, value, *args, **kwargs)

    def set(self, key, value, *args, **kwargs):
        cache_keys: list = self._get_cache_keys()
        try:
            cache_keys.index(key)
        except ValueError:
            cache_keys.append(key)
            cache.set(key, value, *args, **kwargs)

    def delete(self, key, *arg, **kwargs):
        delete = cache.delete(key, *arg, **kwargs)
        if delete:
            self._remove_cache_key(key)
        return delete

    def delete_all(self, *args, **kwargs):
        for item in self._get_cache_keys():
            self.delete(item)

    def _get_cache_keys(self) -> list:
        return cache.get(self.root_key, [])

    def _add_cache_key(self, key):
        cache_keys: list = self._get_cache_keys()
        try:
            cache_keys.index(key)
        except ValueError:
            cache_keys.append(key)
            cache.set(self.root_key, cache_keys)

    def _remove_cache_key(self, key):
        cache_keys: list = self._get_cache_keys()
        try:
            cache_keys.remove(key)
            cache.set(self.root_key, cache_keys)
        except ValueError:
            # No need to reset cache, nothing changed
            pass
