import logging
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
            logging.error("checking if item exists")
            cache_keys.index(key)
            logging.error("item was found")
        except ValueError:
            logging.error("item not found, adding")
            cache_keys.append(key)
            cache.set(self.username, cache_keys)

    def _remove_cache_key(self, key):
        logging.error("checking if item exists")
        cache_keys: list = self._get_cache_keys()
        try:
            logging.error("removing item")
            cache_keys.remove(key)
            logging.error("item removed, updating cache")
            cache.set(self.username, cache_keys)
        except ValueError:
            logging.error("item not exist, no remove needed")
            # No need to reset cache, nothing changed
            pass

    def add(self, key, *args, **kwargs):
        logging.error("add user cache item")
        value = self._add_cache_key(key)
        return cache.add(key, value, *args, **kwargs)

    def delete(self, key, *arg, **kwargs):
        logging.error("remove user cache item")
        delete = cache.delete(key, *arg, **kwargs)
        if delete:
            logging.error("item needs to be removed")
            self._remove_cache_key(key)
        return delete

    def get(self, key, *args, **kwargs):
        logging.error("get user cache item")
        return cache.get(key, *args, **kwargs)

    def get_all_for_user(self, key, *args, **kwargs):
        logging.error("get all user cache items")
        return self._get_cache_keys(key, *args, **kwargs)

    def set(self, key, *args, **kwargs):
        logging.error("set user cache item")
        return cache.set(key, *args, **kwargs)
