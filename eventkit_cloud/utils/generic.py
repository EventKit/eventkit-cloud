import copy
import itertools
import logging
import time
from functools import wraps

from django.conf import settings
from django.core.cache import cache

from eventkit_cloud.feature_selection.feature_selection import slugify

logger = logging.getLogger()

MAX_DB_CONNECTION_RETRIES = 5
TIME_DELAY_BASE = 2  # Used for exponential delays (i.e. 5^y) at 6 would be about a minute max delay.

# The retry here is an attempt to mitigate any possible dropped connections. We chose to do a limited number of
# retries as retrying forever would cause the job to never finish in the event that the database is down. An
# improved method would perhaps be to see if there are connection options to create a more reliable connection.
# We have used this solution for now as I could not find options supporting this in the gdal documentation.


def retry(f):
    @wraps(f)
    def wrapper(*args, **kwds):
        allowed_exceptions = kwds.pop("allowed_exceptions", None)  # TODO use a library that handles this stuff better.
        attempts = kwds.pop("max_repeat", None) or MAX_DB_CONNECTION_RETRIES
        exc = None
        while attempts:
            try:
                return_value = f(*args, **kwds)
                if return_value is None:
                    logger.error("The function {0} failed to return any values.".format(getattr(f, "__name__")))
                    raise Exception("The process failed to return any data, please contact an administrator.")
                return return_value
            except Exception as e:
                if allowed_exceptions and e in allowed_exceptions:
                    raise e
                logger.error("The function {0} threw an error.".format(getattr(f, "__name__")))
                logger.error(str(e))
                exc = e

                if getattr(settings, "TESTING", False):
                    # Don't wait/retry when running tests.
                    break
                attempts -= 1
                logger.info(e)
                if "canceled" in str(e).lower():
                    # If task was canceled (as opposed to fail) don't retry.
                    logger.info("The task was canceled ")
                    attempts = 0
                else:
                    if attempts:
                        delay = TIME_DELAY_BASE ** (MAX_DB_CONNECTION_RETRIES - attempts + 1)
                        logger.error(f"Retrying {str(attempts)} more times, sleeping for {delay}...")
                        time.sleep(delay)
        raise exc

    return wrapper


DEFAULT_TIMEOUT = 60 * 60 * 24  # one day


def serialize_arguments(obj, arg):
    is_builtin = type(arg).__module__ == "builtins"
    if hasattr(arg, "__name__"):
        serialized_arg = arg.__name__
    elif is_builtin:
        serialized_arg = str(slugify(arg))
    else:
        serialized_arg = arg.__class__.__name__
    return getattr(obj, serialized_arg) if hasattr(obj, serialized_arg) else serialized_arg


def cacheable(timeout: int = DEFAULT_TIMEOUT, key_fields=[]):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            arg_string = ".".join([serialize_arguments(None, arg) for arg in args])
            keys = (
                copy.deepcopy(kwargs)
                if not key_fields
                else {
                    key_field: kwargs.get(key_field) if key_field in kwargs else serialize_arguments(args[0], key_field)
                    for key_field in key_fields
                }
            )
            kwarg_string = ".".join([str(slugify(kwarg)) for kwarg in itertools.chain.from_iterable(keys.items())])
            cache_key = f"{func.__name__}.{arg_string}.{kwarg_string}"[:249]
            logger.debug("Getting or setting the cache_key %s", cache_key)
            return_value = cache.get_or_set(cache_key, lambda: func(*args, **kwargs), timeout=timeout)
            return return_value

        return wrapper

    return decorator
