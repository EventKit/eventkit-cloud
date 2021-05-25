import logging
import os

import requests
from django.conf import settings
from django.core.cache import cache

from eventkit_cloud.utils import auth_requests

logger = logging.getLogger(__name__)

CACHE_TOKEN_TIMEOUT = 60 * 5  # 5 Minutes
CACHE_TOKEN_KEY = "geocoding_auth_token"
CACHE_COOKIE_KEY = "geocoding_auth_cookies"


def get_auth_headers():
    headers = cache.get(CACHE_TOKEN_KEY, {})
    # Here we check a "null" value to see if this configuration requires headers.
    if headers == getattr(settings, "GEOCODING_AUTH_URL"):
        return None
    if not headers:
        token = authenticate()
        if token:
            headers = {"Authorization": "Bearer " + str(token)}
            update_auth_headers(headers)
    return headers


def update_auth_headers(headers):
    cache.set(CACHE_TOKEN_KEY, headers, CACHE_TOKEN_TIMEOUT)


def get_session_cookies():
    return cache.get(CACHE_COOKIE_KEY)


def update_session_cookies(cookies):
    cache.set(CACHE_COOKIE_KEY, cookies, CACHE_TOKEN_TIMEOUT)


def authenticate():
    auth_response = None
    try:
        url = getattr(settings, "GEOCODING_AUTH_URL")
        if url:
            logger.info("Receiving new authentication token for geocoder.")
            auth_response = auth_requests.get(
                getattr(settings, "GEOCODING_AUTH_URL"),
                verify=getattr(settings, "SSL_VERIFICATION", True),
                cert_info=get_geocode_cert_info(),
            ).json()

            token = auth_response.get("token")
            # if not token set the token key as something so we know not to check this everytime.
            cache.set(CACHE_TOKEN_KEY, token or url, CACHE_TOKEN_TIMEOUT)
            return token
        return None
    except requests.exceptions.RequestException:
        logger.error("FAILED TO AUTHENTICATE.")
        if auth_response:
            logger.error(auth_response.content)
        cache.delete(CACHE_TOKEN_KEY)
        return None


def get_geocode_cert_info():
    """
    Looks up the path to cert and passphrase for the geocoding cert in the enviornment.

    :return: cert_info dict for geocoder
    """
    return dict(cert_path=os.getenv("GEOCODING_AUTH_CERT_PATH", None), cert_pass_var="GEOCODING_AUTH_CERT_PASS_VAR")
