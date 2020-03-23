import logging
import tempfile
import traceback

import requests
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

CACHE_TOKEN_TIMEOUT = 60 * 5  # 5 Minutes
CACHE_TOKEN_KEY = "pelias_token"
CACHE_COOKIE_KEY = "cookies"


def get_auth_headers():
    headers = {}
    if getattr(settings, "GEOCODING_AUTH_URL") is not None:
        token = cache.get(CACHE_TOKEN_KEY) or authenticate()
        if token:
            headers = {"Authorization": "Bearer " + str(token)}
    return headers


def update_auth_headers(response):
    if response.headers != get_auth_headers():
        cache.set(CACHE_TOKEN_KEY, response.headers, CACHE_TOKEN_TIMEOUT)


def get_session_cookies():
    if getattr(settings, "GEOCODING_AUTH_URL") is not None:
        cookies = cache.get(CACHE_COOKIE_KEY)
        return cookies


def update_session_cookies(session):
    cached_cookies = cache.get(CACHE_COOKIE_KEY)
    if cached_cookies != session.cookies:
        cache.set(CACHE_COOKIE_KEY, session.cookies)


def authenticate():
    logger.info("Receiving new authentication token for geocoder")
    try:
        cert = getattr(settings, "GEOCODING_AUTH_CERT", "")
        with tempfile.NamedTemporaryFile(suffix=".crt", delete=False) as temp_file:
            temp_file.write(cert.replace("\\n", "\n").encode())
            temp_file.flush()
            public_cert = ("").join(cert.partition("-----END CERTIFICATE-----")[:-1])
            # clean line endings, the service wants the public cert without line returns.
            public_cert.replace("\n", "\\n").replace("\\n", "")
            verify = getattr(settings, "SSL_VERIFICATION", True)

            auth_response = requests.get(
                getattr(settings, "GEOCODING_AUTH_URL"), verify=verify, cert=temp_file.name,
            ).json()

            token = auth_response.get("token")
            cache.set(CACHE_TOKEN_KEY, token, CACHE_TOKEN_TIMEOUT)
            return token

    except requests.exceptions.RequestException as e:
        logger.error(traceback.print_exc())
        cache.delete(CACHE_TOKEN_KEY)
        return None
