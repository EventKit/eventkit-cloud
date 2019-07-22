# -*- coding: utf-8 -*-
import http.client
import logging
import os
import re
import urllib.request, urllib.error, urllib.parse
from functools import wraps
from tempfile import NamedTemporaryFile

import requests
from mapproxy.client import http as mapproxy_http

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
                             ", ".join(["%s=%s" % (k, v) for k, v in kwargs.items()]))
                with NamedTemporaryFile() as certfile:
                    certfile.write(content.encode())
                    certfile.flush()
                    return func(cert=certfile.name, *args, **kwargs)
            else:
                return func(*args, **kwargs)
        logger.debug("Cert wrapped function %s", func.__name__)
        return wrapper
    return decorator


def find_cert_var(cert_var: str=None):
    """
    Given a provider slug, returns the contents of an environment variable consisting of the slug (lower or uppercase)
    followed by "_CERT". If no variable was found, return None.
    :param cert_var: Provider slug
    :return: Cert contents if found
    """
    if cert_var:
        env_slug: str = cert_var.replace('-', '_')
        cert: str = os.getenv(env_slug + "_CERT") or os.getenv(env_slug.upper() + "_CERT") or os.getenv(env_slug)
    else:
        cert = None

    if cert:
        cert = cert.replace('\\n', '\n')

    return cert


def cert_var_to_cert(func):
    """
    Decorator that takes a kwarg `slug` of the target function, and replaces it with `cert`, which points to an
    open file containing the client certificate and key for that provider slug.
    If an environment variable for that slug and cert was not found, call the function without the cert kwarg.
    To avoid unnecessary overhead in creating multiple temporary files, this decorator should generally be applied last.
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        cert_env = find_cert_var(kwargs.pop("cert_var", None))
        return content_to_file(cert_env)(func)(*args, **kwargs)
    return wrapper


def get_cred(cred_var=None, url=None, params=None):
    """
    Given a URL with a query string, locates parameters corresponding to username and password, and returns them.
    If both username and password are not found, return None.
    :param cred_var: Provider slug
    :param url: URL with query string
    :param params: Parameters dict to be passed to request
    :return: (username, password) or None
    """
    # Check for environment variable
    cred = None
    if cred_var:
        env_slug = cred_var.replace('-', '_')
        cred = os.getenv(env_slug + "_CRED") or os.getenv(env_slug.upper() + "_CRED") or os.getenv(env_slug)
    if cred is not None and ":" in cred and all(cred.split(":")):
        logger.debug("Found credentials for %s in env var", cred_var)
        return cred.split(":")

    # Check url and params for http credentials
    if url:
        cred_str = re.search(r"(?<=://)[a-zA-Z0-9\-._~]+:[a-zA-Z0-9\-._~]+(?=@)", url)
        if cred_str:
            logger.debug("Found credentials for %s in query string", cred_var)
            return cred_str.group().split(":")

        # Check in query string
        username = re.search(r"(?<=[?&]username=)[a-zA-Z0-9\-._~]+", url)
        password = re.search(r"(?<=[?&]password=)[a-zA-Z0-9\-._~]+", url)
        cred = (username.group(), password.group()) if username and password else None
        if cred:
            logger.debug("Found credentials for %s in query string", cred_var)
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
        try:
            if not kwargs.get("cert_var"):
                cred_var = kwargs.pop("cred_var", None) or kwargs.pop("slug", None)
            cred = get_cred(cred_var=cred_var, url=url, params=kwargs.get("params", None))
            if cred:
                kwargs["auth"] = tuple(cred)
            logger.debug("requests.%s('%s', %s)", func.__name__, url, ", ".join(["%s=%s" % (k,v) for k,v in kwargs.items()]))
            response = func(url, **kwargs)
            return response
        except Exception as e:
            logger.error(str(e))
            raise Exception("Unable to securely connect to this provider.")

    return wrapper


@cert_var_to_cert
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


@cert_var_to_cert
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


_ORIG_HTTPSCONNECTION_INIT = http.client.HTTPSConnection.__init__
_ORIG_URLOPENERCACHE_CALL = mapproxy_http._URLOpenerCache.__call__


def patch_https(slug: str = None, cert_var: str = None):
    """
    Given a provider slug, wrap the initializer for HTTPSConnection so it checks for client keys and certs
    in environment variables named after the given slug, and if found, provides them to the SSLContext.
    If no certs are found, this should function identically to the original, even if external certs/keys are given.
    :param slug: Provider slug, used for finding cert/key environment variable
    :param cert_var: An optional parameter, to use for finding the cert/key in the environment.
                     Takes priority over slug.
    :return: None
    """
    cert_var = cert_var or slug
    cert = find_cert_var(cert_var)
    logger.debug("Patching with slug %s, cert [%s B]", slug, len(cert) if cert is not None else 0)

    @content_to_file(cert)
    def _new_init(_self, *args, **kwargs):
        certfile = kwargs.pop("cert", None)
        kwargs["key_file"] = certfile or kwargs.get("key_file", None)
        kwargs["cert_file"] = certfile or kwargs.get("cert_file", None)
        logger.debug(F"Initializing new HTTPSConnection with provider={slug}, cert_var={cert_var} certfile={certfile}")
        _ORIG_HTTPSCONNECTION_INIT(_self, *args, **kwargs)

    http.client.HTTPSConnection.__init__ = _new_init


def patch_mapproxy_opener_cache(slug=None, cred_var=None):
    """
    Monkey-patches MapProxy's urllib opener constructor to include support for http cookies.
    :return:
    """
    # Source: https://github.com/mapproxy/mapproxy/blob/1.11.0/mapproxy/client/http.py#L133

    def _new_call(self, ssl_ca_certs, url, username, password, insecure=False):
        if ssl_ca_certs not in self._opener or slug not in self._opener:
            if not isinstance(os.getenv('SSL_VERIFICATION', True), bool):
                ssl_ca_certs = os.getenv('SSL_VERIFICATION')
            https_handler = mapproxy_http.build_https_handler(ssl_ca_certs, insecure)
            passman = urllib.request.HTTPPasswordMgrWithDefaultRealm()
            handlers = [urllib.request.HTTPCookieProcessor,
                        urllib.request.HTTPRedirectHandler(),
                        https_handler,
                        urllib.request.HTTPBasicAuthHandler(passman),
                        urllib.request.HTTPDigestAuthHandler(passman)]

            opener = urllib.request.build_opener(*handlers)
            opener.addheaders = [('User-agent', 'MapProxy-%s' % (mapproxy_http.version,))]

            self._opener[ssl_ca_certs or slug] = (opener, passman)
        else:
            opener, passman = self._opener[ssl_ca_certs or slug]

        cred = get_cred(cred_var=cred_var or slug)
        if cred and len(cred) == 2:
            username = username or cred[0]
            password = password or cred[1]

        if url is not None and username is not None and password is not None:
            passman.add_password(None, url, username, password)

        return opener

    mapproxy_http._URLOpenerCache.__call__ = _new_call


def unpatch_mapproxy_opener_cache():
    mapproxy_http._URLOpenerCache.__call__ = _ORIG_URLOPENERCACHE_CALL


def unpatch_https():
    """
    Remove the patch applied by patch_https, restoring the original initializer for HTTPSConnection.
    :return: None
    """
    http.client.HTTPSConnection.__init__ = _ORIG_HTTPSCONNECTION_INIT
