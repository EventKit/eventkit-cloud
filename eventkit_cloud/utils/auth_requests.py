# -*- coding: utf-8 -*-
import logging
import requests
import os
from tempfile import NamedTemporaryFile

import httplib

logger = logging.getLogger(__name__)


def content_to_file(content):
    """
    Given content for a file, constructs a decorator that creates and destroys a temporary file containing that content,
    passing it to the decorated function as the keyword argument `cert`.
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            if content:
                logger.debug("Content found for {}({}, {})".format(func.__name__,
                                                                  ", ".join([str(arg) for arg in args]),
                                                                  ", ".join(["{}={}".format(k, v) for k, v in kwargs.iteritems()])))
                with NamedTemporaryFile() as certfile:
                    certfile.write(content)
                    certfile.flush()
                    return func(cert=certfile.name, *args, **kwargs)
            else:
                return func(*args, **kwargs)
        logger.debug("Cert wrapped function {}".format(func.__name__))
        return wrapper
    return decorator


def find_cert(slug=None):
    if slug:
        cert = os.getenv(slug + "_CERT") or os.getenv(slug.upper() + "_CERT")
    else:
        cert = None

    if cert:
        cert = cert.replace('\\n', '\n')

    return cert


def slug_to_cert(func):
    """
    Decorator that takes a kwarg `slug` of the target function, and replaces it with `cert`, which points to an
    open file containing the client certificate and key for that provider slug.
    If an environment variable for that slug and cert was not found, call the function without the cert kwarg.
    """
    def wrapper(*args, **kwargs):
        cert_env = find_cert(kwargs.pop("slug", None))

        return content_to_file(cert_env)(func)(*args, **kwargs)
    return wrapper


@slug_to_cert
def request_with_cert(method, url, **kwargs):
    try:
        return method(url, **kwargs)
    except requests.exceptions.SSLError as e:
        logger.error('Could not establish SSL connection: possibly missing client certificate')
        raise e


def get(url, **kwargs):
    return request_with_cert(requests.get, url, **kwargs)


def post(url, **kwargs):
    return request_with_cert(requests.post, url, **kwargs)


_orig_HTTPSConnection_init = httplib.HTTPSConnection.__init__


def patch_https(slug):
    """
    Given a provider slug, wrap the initializer for HTTPSConnection so it checks for client keys and certs
    in environment variables named after the given slug, and if found, provides them to the SSLContext.
    If no certs are found, this should function identically to the original, even if external certs/keys are given.
    :param slug: Provider slug, used for finding cert/key environment variable
    :return: None
    """
    cert = find_cert(slug)
    logger.debug("Patching with slug {}, cert [{} B]".format(slug, len(cert) if cert is not None else 0))

    @content_to_file(cert)
    def _new_init(_self, *args, **kwargs):
        certfile = kwargs.pop("cert", None)
        kwargs["key_file"] = certfile or kwargs.get("key_file", None)
        kwargs["cert_file"] = certfile or kwargs.get("cert_file", None)
        logger.debug("Initializing new HTTPSConnection with provider={}, certfile={}".format(slug, certfile))
        _orig_HTTPSConnection_init(_self, *args, **kwargs)

    httplib.HTTPSConnection.__init__ = _new_init


def unpatch_https():
    httplib.HTTPSConnection.__init__ = _orig_HTTPSConnection_init
