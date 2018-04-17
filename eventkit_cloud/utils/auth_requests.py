# -*- coding: utf-8 -*-
import os
import re
import httplib
from tempfile import NamedTemporaryFile
import logging
from functools import wraps
import urllib2
import requests

from mapproxy.client import http


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


def find_cert_var(slug=None):
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
        cert_env = find_cert_var(kwargs.get("slug", None))

        return content_to_file(cert_env)(func)(*args, **kwargs)
    return wrapper


def get_cred(slug=None, url=None, params=None):
    """
    Given a URL with a query string, locates parameters corresponding to username and password, and returns them.
    If both username and password are not found, return None.
    :param slug: Provider slug
    :param url: URL with query string
    :param params: Parameters dict to be passed to request
    :return: (username, password) or None
    """
    # Check for environment variable
    cred = None
    if slug:
        cred = os.getenv(slug + "_CRED") or os.getenv(slug.upper() + "_CRED")
    if cred is not None and ":" in cred and all(cred.split(":")):
        logger.debug("Found credentials for %s in env var", slug)
        return cred.split(":")

    # Check url and params for http credentials
    if url:
        cred_str = re.search(r"(?<=://)[a-zA-Z0-9\-._~]+:[a-zA-Z0-9\-._~]+(?=@)", url)
        if cred_str:
            logger.debug("Found credentials for %s in query string", slug)
            return cred_str.group().split(":")

        # Check in query string
        username = re.search(r"(?<=[?&]username=)[a-zA-Z0-9\-._~]+", url)
        password = re.search(r"(?<=[?&]password=)[a-zA-Z0-9\-._~]+", url)
        cred = (username.group(), password.group()) if username and password else None
        if cred:
            logger.debug("Found credentials for %s in query string", slug)
            return cred

    if params and params.get("username") and params.get("password"):
        cred = (params.get("username"), params.get("password"))

    return cred


def handle_basic_auth(func):
    """
    Decorator for requests methods that supplies username and password as HTTPBasicAuth header.
    Checks first for credentials environment variable, then URL, and finally kwarg parameters.
    :param func: A requests method that returns an instance of requests.models.Response
    :return: result of requests function call
    """
    @wraps(func)
    def wrapper(url, **kwargs):

        cred = get_cred(slug=kwargs.pop("slug", None), url=url, params=kwargs.get("params", None))
        if cred:
            kwargs["auth"] = tuple(cred)
        logger.debug("requests.%s('%s', %s)", func.__name__, url, ", ".join(["%s=%s" % (k,v) for k,v in kwargs.iteritems()]))
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
_ORIG_URLOPENERCACHE_CALL = http._URLOpenerCache.__call__


def patch_https(slug):
    """
    Given a provider slug, wrap the initializer for HTTPSConnection so it checks for client keys and certs
    in environment variables named after the given slug, and if found, provides them to the SSLContext.
    If no certs are found, this should function identically to the original, even if external certs/keys are given.
    :param slug: Provider slug, used for finding cert/key environment variable
    :return: None
    """
    cert = find_cert_var(slug)
    logger.debug("Patching with slug %s, cert [%s B]", slug, len(cert) if cert is not None else 0)

    @content_to_file(cert)
    def _new_init(_self, *args, **kwargs):
        certfile = kwargs.pop("cert", None)
        kwargs["key_file"] = certfile or kwargs.get("key_file", None)
        kwargs["cert_file"] = certfile or kwargs.get("cert_file", None)
        logger.debug("Initializing new HTTPSConnection with provider=%s, certfile=%s", slug, certfile)
        _ORIG_HTTPSCONNECTION_INIT(_self, *args, **kwargs)

    httplib.HTTPSConnection.__init__ = _new_init


def patch_mapproxy_opener_cache(slug=None):
    """
    Monkey-patches MapProxy's urllib opener constructor to include support for http cookies.
    :return:
    """
    # Source: https://github.com/mapproxy/mapproxy/blob/a24cb41d3b3abcbb8a31460f4d1a0eee5312570a/mapproxy/client/http.py#L81

    def _new_call(self, ssl_ca_certs, url, username, password):
        if ssl_ca_certs not in self._opener or slug not in self._opener:
            https_handler = urllib2.BaseHandler()
            if ssl_ca_certs:
                connection_class = http.verified_https_connection_with_ca_certs(ssl_ca_certs)
                https_handler = http.VerifiedHTTPSConnection(connection_class=connection_class)
            passman = urllib2.HTTPPasswordMgrWithDefaultRealm()
            handlers = [urllib2.HTTPCookieProcessor,
                        urllib2.HTTPRedirectHandler(),
                        https_handler,
                        urllib2.HTTPBasicAuthHandler(passman),
                        urllib2.HTTPDigestAuthHandler(passman)]

            opener = urllib2.build_opener(*handlers)
            opener.addheaders = [('User-agent', 'MapProxy-%s' % (http.version,))]

            self._opener[ssl_ca_certs or slug] = (opener, passman)
        else:
            opener, passman = self._opener[ssl_ca_certs or slug]

        cred = get_cred(slug=slug)
        if cred and len(cred) == 2:
            username = username or cred[0]
            password = password or cred[1]

        if url is not None and username is not None and password is not None:
            passman.add_password(None, url, username, password)

        return opener

    http._URLOpenerCache.__call__ = _new_call


def unpatch_mapproxy_opener_cache():
    http._URLOpenerCache.__call__ = _ORIG_URLOPENERCACHE_CALL


def unpatch_https():
    """
    Remove the patch applied by patch_https, restoring the original initializer for HTTPSConnection.
    :return: None
    """
    httplib.HTTPSConnection.__init__ = _ORIG_HTTPSCONNECTION_INIT
