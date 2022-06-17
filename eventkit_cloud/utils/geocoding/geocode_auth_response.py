import logging
import os

from eventkit_cloud.core.helpers import get_or_update_session
from eventkit_cloud.utils.geocoding.geocode_auth import (
    get_auth_headers,
    get_geocode_cert_info,
    get_session_cookies,
    update_session_cookies,
)

logger = logging.getLogger(__name__)


class GeocodeAuthResponse(object):
    def __int__(self):
        self.url = ""

    def get_response(self, payload):
        error_message = (
            "The Geocoding service received an error. Please try again or contact an Eventkit administrator."
        )
        if os.getenv("GEOCODING_AUTH_CERT"):
            response = get_cached_response(self.url, payload)
            if not response:
                response = get_auth_response(self.url, payload)
            if response:
                return response
            else:
                raise Exception(error_message)
        else:
            session = get_or_update_session()
            response = session.get(self.url, params=payload)
            if not response.ok:
                raise Exception(error_message)
            return response


def get_cached_response(url, payload):
    cookies = get_session_cookies()
    headers = get_auth_headers()
    session = get_or_update_session(headers=headers)
    response = session.get(url, params=payload, cookies=cookies)
    if response.ok and check_data(response):
        return response


def get_auth_response(url, payload):
    session = get_or_update_session(cert_info=get_geocode_cert_info())
    response = session.get(url, params=payload)
    if response.ok and check_data(response):
        update_session_cookies(session.cookies)
        return response


def check_data(response):
    # This assumes that a geojson is a valid response, so we're checking for a
    # geometry object, feature object, or FeatureCollection, but aren't verifying that its a valid
    # geojson.  Nominatim may not return a geojson in the initial response, so check for geojson field.
    try:
        if any(field in response.json() for field in ("features", "geometry", "coordinates", "geojson")):
            return True
    except Exception:
        logger.warning("Invalid response.")
        logger.debug(response.content)
    return False
