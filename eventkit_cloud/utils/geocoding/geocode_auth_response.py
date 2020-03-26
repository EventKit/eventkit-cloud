import logging
import os
from eventkit_cloud.utils.geocoding.geocode_auth import get_session_cookies, get_auth_headers, update_auth_headers, \
    update_session_cookies
from eventkit_cloud.utils import auth_requests


logger = logging.getLogger(__name__)


class GeocodeAuthResponse(object):

    def get_response(self, payload):
        if os.getenv("GEOCODING_AUTH_CERT"):
            cookies = get_session_cookies()
            headers = get_auth_headers()
            response = auth_requests.get(self.url, params=payload, cookies=cookies, headers=headers)
            if check_data(response):
                return response
            else:
                auth_session = auth_requests.AuthSession()
                response = auth_session.get(self.url, params=payload, cert_var="GEOCODING_AUTH_CERT")
                if response.ok:
                    if check_data(response):
                        # if valid, update cache headers and cookies
                        if cookies != auth_session.session.cookies:
                            update_session_cookies(auth_session.session.cookies)
                        authorization_header = response.headers.get("Authorization")
                        if headers.get("Authorization") != authorization_header:
                            update_auth_headers(authorization_header)
                        return response
                    raise Exception(
                        "The Geocoding service received an error. Please try again or contact an Eventkit administrator."
                    )
                else:
                    raise AuthenticationError(
                        "The Geocoding service received an error or was unable to authenticate. Please try again or contact an Eventkit administrator."
                    )
        else:
            response = auth_requests.get(self.url, params=payload)
            if not response.ok:
                raise Exception(
                    "The Geocoding service received an error. Please try again or contact an Eventkit " "administrator."
                )
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


class AuthenticationError(Exception):
    def __init__(self, message):
        self.message = message
