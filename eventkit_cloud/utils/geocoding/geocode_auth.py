import logging
import tempfile
import traceback
import requests
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

CACHE_TOKEN_TIMEOUT = 60 * 5  # 5 Minutes
CACHE_TOKEN_KEY = "pelias_token"


def get_auth_headers():
    headers = {}
    if getattr(settings, "GEOCODING_AUTH_URL") is not None:
        headers = cache.get(CACHE_TOKEN_KEY) or authenticate()
    return headers
    logger.info(f'END OF HEADERS: {headers}')


# should not be hitting authenticate if headers are there -just for the first time

def authenticate():
    try:
        logger.info("Receiving new authentication token for geocoder")
        logger.info(f'HITTING AUTHENTICATE HERE')
        cert = getattr(settings, "GEOCODING_AUTH_CERT", "")
        with tempfile.NamedTemporaryFile(suffix=".crt", delete=False) as temp_file:
            temp_file.write(cert.replace("\\n", "\n").encode())
            temp_file.flush()
            public_cert = ("").join(cert.partition("-----END CERTIFICATE-----")[:-1])
            # clean line endings, the service wants the public cert without line returns.
            public_cert = public_cert.replace("\n", "\\n").replace("\\n", "")
            verify = getattr(settings, "SSL_VERIFICATION", True)
            url = getattr(settings, "GEOCODING_AUTH_URL")

            logger.info(f'PUBLIC CERT: {public_cert}')
            logger.info(f'URL: {url}')

            response = requests.get(
                url=url,
                verify=verify,
                cert=temp_file.name,
                headers={"SSL_CLIENT_CERT": public_cert},
            )
            headers = response.headers
            logger.info(f'HEADERS!: {headers}')

            my_cache = cache.set(CACHE_TOKEN_KEY, headers, CACHE_TOKEN_TIMEOUT)
            logger.info(f'MORE HEADERS!: {headers}')
            return headers

    except requests.exceptions.RequestException as e:
        logger.error(traceback.print_exc())
        cache.delete(CACHE_TOKEN_KEY)
        return None
