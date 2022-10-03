# -*- coding: utf-8 -*-
import http.client
import logging
import os
import re
import urllib.error
import urllib.parse
from functools import wraps
from http.cookiejar import CookieJar
from tempfile import NamedTemporaryFile
from typing import Any

from django.conf import settings
from requests_pkcs12 import create_pyopenssl_sslcontext

from mapproxy.client import http as mapproxy_http

logger = logging.getLogger(__name__)


# TODO: remove this if it's not needed anymore.
def content_to_file(content):
    """
    Given content for a file, constructs a decorator that creates and destroys a temporary file containing that content,
    passing it to the decorated function as the keyword argument `cert`.
    """

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if content:
                logger.debug(
                    "Content found for %s(%s, %s)",
                    func.__name__,
                    ", ".join([str(arg) for arg in args]),
                    ", ".join(["%s=%s" % (k, v) for k, v in kwargs.items()]),
                )
                with NamedTemporaryFile() as certfile:
                    certfile.write(content.encode())
                    certfile.flush()
                    return func(cert=certfile.name, *args, **kwargs)
            else:
                return func(*args, **kwargs)

        logger.debug("Cert wrapped function %s", func.__name__)
        return wrapper

    return decorator


def get_cert_info(kwargs_dict):
    """
    Gets and returns the cert info from a kwargs dict if they are present.

    :param kwargs_dict: passed in dict representing kwargs passed to a calling function.
    :return:tuple (cert_path, cert_pass_var) either may be None
    """
    cert_info = kwargs_dict.pop("cert_info", None)
    if cert_info:
        cert_path = cert_info.get("cert_path")
        cert_pass_var = cert_info.get("cert_pass_var", "")
    else:
        cert_path = kwargs_dict.get("cert_path")
        cert_pass_var = kwargs_dict.get("cert_pass_var", "")
    cert_pass = os.getenv(cert_pass_var)
    if (cert_info or cert_path) and not (cert_path and cert_pass):
        logger.error(
            f"Cert information was passed in but cert_path={cert_path} or cert_pass_var={cert_pass_var})"
            f"are not correctly configured"
        )
        raise Exception("Certificate information is improperly configured.")
    return cert_path, cert_pass


def get_cred_token(kwargs_dict=None):
    """
    Gets and returns the cert info from a kwargs dict if they are present.

    :param kwargs_dict: passed in dict representing kwargs passed to a calling function.
    :return:tuple (cert_path, cert_pass_var) either may be None
    """
    cred_token = kwargs_dict.pop("cred_token", None)
    if not cred_token:
        return None
    token = os.getenv(cred_token)
    if not token:
        logger.error("A token credential was configured for %s but the variable is not set.", cred_token)
        raise Exception("The service token is improperly configured.")
    return token


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
    cred: Any = None
    if cred_var:
        env_slug = cred_var.replace("-", "_")
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


_ORIG_HTTPSCONNECTION_INIT = http.client.HTTPSConnection.__init__
_ORIG_URLOPENERCACHE_CALL = mapproxy_http._URLOpenerCache.__call__


def patch_https(cert_info: dict = None):
    """
    Given cert info for a provider, establishes a SSSLContext object using requests_pkcs12 for HTTPSConnection.
    If no certs are found, this should function identically to the original.
    :param cert_info: An optional parameter, must contain path to cert and the passphrase
    :return: None
    """

    def _new_init(_self, *args, **kwargs):
        cert_path, cert_pass = get_cert_info(dict(cert_info=cert_info))
        if not (cert_path is None or cert_pass is None):
            # create_ssl_sslcontext needs the cert data, instead of the filepath
            with open(cert_path, "rb") as pkcs12_file:
                pkcs12_data = pkcs12_file.read()
            kwargs["context"] = create_pyopenssl_sslcontext(pkcs12_data, cert_pass)
        _ORIG_HTTPSCONNECTION_INIT(_self, *args, **kwargs)

    # mypy does not like patching
    http.client.HTTPSConnection.__init__ = _new_init  # type: ignore


def patch_mapproxy_opener_cache(slug=None, cred_var=None):
    """
    Monkey-patches MapProxy's urllib opener constructor to include support for http cookies.
    :return:
    """
    # Source: https://github.com/mapproxy/mapproxy/blob/1.11.0/mapproxy/client/http.py#L133

    def _new_call(self, ssl_ca_certs, url, username, password, insecure=False, manage_cookies=True):

        if ssl_ca_certs not in self._opener or slug not in self._opener:
            ssl_verify = getattr(settings, "SSL_VERIFICATION", True)
            if not isinstance(ssl_verify, bool):
                ssl_ca_certs = ssl_verify
            https_handler = mapproxy_http.build_https_handler(ssl_ca_certs, insecure)
            passman = urllib.request.HTTPPasswordMgrWithDefaultRealm()
            handlers = [
                urllib.request.HTTPRedirectHandler(),
                https_handler,
                urllib.request.HTTPBasicAuthHandler(passman),
                urllib.request.HTTPDigestAuthHandler(passman),
            ]
            if manage_cookies:
                cj = CookieJar()
                handlers.append(urllib.request.HTTPCookieProcessor(cj))

            opener = urllib.request.build_opener(*handlers)
            opener.addheaders = [("User-agent", "MapProxy-%s" % (mapproxy_http.version,))]

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
    # mypy does not like patching
    http.client.HTTPSConnection.__init__ = _ORIG_HTTPSCONNECTION_INIT  # type: ignore
