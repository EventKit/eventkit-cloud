import logging
import os
from eventkit_cloud.utils.geocoding.geocode_auth import (
    get_session_cookies,
    get_auth_headers,
    update_auth_headers,
    update_session_cookies,
)
from eventkit_cloud.utils import auth_requests


logger = logging.getLogger(__name__)


class GeocodeAuthResponse(object):
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
            response = auth_requests.get(self.url, params=payload)
            if not response.ok:
                raise Exception(error_message)
            return response


def get_cached_response(url, payload):
    cookies = get_session_cookies()
    headers = get_auth_headers()
    response = auth_requests.get(url, params=payload, cookies=cookies, headers=headers)
    if response.ok and check_data(response):
        return response


def get_auth_response(url, payload):
    auth_session = auth_requests.AuthSession()
    response = auth_session.get(url, params=payload, cert_var="GEOCODING_AUTH_CERT")
    if response.ok and check_data(response):
        update_session_cookies(auth_session.session.cookies)
        update_auth_headers(response.headers)
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
