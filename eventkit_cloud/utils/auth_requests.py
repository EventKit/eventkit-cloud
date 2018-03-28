# -*- coding: utf-8 -*-
import os
import re
import httplib
from tempfile import NamedTemporaryFile
import logging
from functools import wraps
import requests


logger = logging.getLogger(__name__)


def content_to_file(content):
    """
    Given content for a file, constructs a decorator that creates and destroys a temporary file containing that content,
    passing it to the decorated function as the keyword argument `cert`.
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if content:
                logger.debug("Content found for %s(%s, %s)",
                             func.__name__,
                             ", ".join([str(arg) for arg in args]),
                             ", ".join(["%s=%s" % (k, v) for k, v in kwargs.iteritems()]))
                with NamedTemporaryFile() as certfile:
                    certfile.write(content)
                    certfile.flush()
                    return func(cert=certfile.name, *args, **kwargs)
            else:
                return func(*args, **kwargs)
        logger.debug("Cert wrapped function %s", func.__name__)
        return wrapper
    return decorator


def find_cert(slug=None):
    """
    Given a provider slug, returns the contents of an environment variable consisting of the slug (lower or uppercase)
    followed by "_CERT". If no variable was found, return None.
    :param slug: Provider slug
    :return: Cert contents if found
    """
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
    To avoid unnecessary overhead in creating multiple temporary files, this decorator should generally be applied last.
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        cert_env = find_cert(kwargs.pop("slug", None))

        return content_to_file(cert_env)(func)(*args, **kwargs)
    return wrapper


def handle_basic_auth(func):
    """
    Decorator for requests methods that retries 401 response codes using username and password from query string
     to construct a HTTPBasicAuth.
    :param func: A requests method that returns an instance of requests.models.Response
    :return: result of initial call if successful, or result of retry if it was 401 and username/password were available
    """
    @wraps(func)
    def wrapper(url, **kwargs):
        response = func(url, **kwargs)
        if not isinstance(response, requests.models.Response):
            return response
        if response.status_code != 401:
            return response
        # We're unauthorized; look for username/password
        # Check kwargs
        params = kwargs.get("params")
        cred = None
        if params and params.get("username") and params.get("password"):
            cred = (params.get("username"), params.get("password"))

        if not cred:
            # Check query string
            username = re.search(r"(?<=[?&]username=)[a-zA-Z0-9\-._~]+", url)
            password = re.search(r"(?<=[?&]password=)[a-zA-Z0-9\-._~]+", url)
            cred = (username.group(), password.group()) if username and password else None

        if not cred:
            return response

        kwargs["auth"] = cred
        response = func(url, **kwargs)
        return response
    return wrapper


@slug_to_cert
@handle_basic_auth
def get(url, **kwargs):
    """
    As requests.get, but replaces the "slug" kwarg with "cert", pointing to a temporary file holding cert and key info,
    if found.
    :param url: URL for requests.get
    :param kwargs: Dict is passed along unaltered to requests.get, except for removing "slug" and adding "cert".
    :return: Result of requests.get call
    """
    return requests.get(url, **kwargs)


@slug_to_cert
@handle_basic_auth
def post(url, **kwargs):
    """
    As requests.post, but replaces the "slug" kwarg with "cert", pointing to a temporary file holding cert and key info,
    if found.
    :param url: URL for requests.get
    :param kwargs: Dict is passed along unaltered to requests.post, except for removing "slug" and adding "cert".
    :return: Result of requests.post call
    """
    return requests.post(url, **kwargs)


_ORIG_HTTPSCONNECTION_INIT = httplib.HTTPSConnection.__init__


def patch_https(slug):
    """
    Given a provider slug, wrap the initializer for HTTPSConnection so it checks for client keys and certs
    in environment variables named after the given slug, and if found, provides them to the SSLContext.
    If no certs are found, this should function identically to the original, even if external certs/keys are given.
    :param slug: Provider slug, used for finding cert/key environment variable
    :return: None
    """
    cert = find_cert(slug)
    logger.debug("Patching with slug %s, cert [%s B]", slug, len(cert) if cert is not None else 0)

    @content_to_file(cert)
    def _new_init(_self, *args, **kwargs):
        certfile = kwargs.pop("cert", None)
        kwargs["key_file"] = certfile or kwargs.get("key_file", None)
        kwargs["cert_file"] = certfile or kwargs.get("cert_file", None)
        logger.debug("Initializing new HTTPSConnection with provider=%s, certfile=%s", slug, certfile)
        _ORIG_HTTPSCONNECTION_INIT(_self, *args, **kwargs)

    httplib.HTTPSConnection.__init__ = _new_init


def unpatch_https():
    """
    Remove the patch applied by patch_https, restoring the original initializer for HTTPSConnection.
    :return: None
    """
    httplib.HTTPSConnection.__init__ = _ORIG_HTTPSCONNECTION_INIT
