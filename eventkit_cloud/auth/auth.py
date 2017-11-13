from __future__ import absolute_import

import requests
import logging
from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth import logout as auth_logout
from django.shortcuts import redirect
from .models import OAuth
import json
from datetime import datetime, timedelta
import dateutil.parser
import pytz

logger = logging.getLogger(__name__)


def auto_logout(get_response):
    def middleware(request):
        # Only check for auto logout if we're logged in.
        if not request.user.is_authenticated():
            return get_response(request)

        last_active_at_iso = request.session.get(settings.SESSION_USER_LAST_ACTIVE_AT)
        if last_active_at_iso:
            # Check if our inactive time has exceeded the auto logout time limit.
            last_active_at = dateutil.parser.parse(last_active_at_iso)
            time_passed = datetime.utcnow().replace(tzinfo=pytz.utc) - last_active_at
            if time_passed >= timedelta(0, settings.AUTO_LOGOUT_SECONDS, 0):
                # Force logout and redirect to login page.
                auth_logout(request)
                response = redirect('login')
                if settings.SESSION_USER_LAST_ACTIVE_AT in request.session:
                    del request.session[settings.SESSION_USER_LAST_ACTIVE_AT]
                response.delete_cookie(settings.AUTO_LOGOUT_COOKIE_NAME, domain=settings.SESSION_COOKIE_DOMAIN)
                return response

        return get_response(request)

    return middleware


def fetch_user_from_token(access_token):
    """
    
    :param access_token: Uses OAuth token to retrieve user data from the resource server.
    :return: User object.
    """

    logger.debug('Sending request: access_token="{0}"'.format(access_token))
    try:
        response = requests.get(
            '{0}'.format(settings.OAUTH_PROFILE_URL),
            headers={
                'Authorization': 'Bearer {0}'.format(access_token),
            },
        )
        logger.debug('Received response: {0}'.format(response.text))
        response.raise_for_status()
    except requests.ConnectionError as err:
        logger.error('Could not reach OAuth Resource Server: {0}'.format(err))
        raise OAuthServerUnreachable()
    except requests.HTTPError as err:
        status_code = err.response.status_code
        if status_code == 401:
            logger.error('OAuth Resource Server rejected access token: {0}'.format(err.response.text))
            raise Unauthorized('OAuth Resource Server rejected access token')
        logger.error('OAuth Resource Server returned HTTP {0} {1}'.format(status_code, err.response.text))
        raise OAuthError(status_code)

    user_data = get_user_data_from_schema(response.json())

    return get_user(user_data)



def get_user(user_data):
    """
    A helper function for retrieving or creating a user given a user_data dictionary.
    :param user_data: A dict containg user data.
    :return: 
    """
    oauth = OAuth.objects.filter(identification=user_data.get('identification')).first()
    if not oauth:
        try:
            identification = user_data.pop('identification')
            commonname = user_data.pop('commonname')
        except KeyError as ke:
            logger.error("Required field not provided.")
            raise ke
        try:
            user = User.objects.create(**user_data)
        except Exception as e:
            logger.error("The user data provided could not be used to create a user, "
                         "it most likely caused by OAUTH_PROFILE_SCHEMA containing an invalid key.")
            raise e
        try:
            OAuth.objects.create(user=user, identification=identification, commonname=commonname)
        except Exception as e:
            logger.error("The user data provided by the resource server could not be used to create a user, "
                         "it most likely caused by OAUTH_PROFILE_SCHEMA mapping is incorrect and/or not providing "
                         "a valid identification and commonname.")
            user.delete()
            raise e
        user_data['identification'] = identification
        user_data['commonname'] = commonname
        return user
    else:
        return oauth.user


def get_user_data_from_schema(data):
    """
    Uses schema provided in settings to get user_data.
    :param data: user profile data from oauth_service 
    :return: a dict of user_data.
    """
    user_data = dict()
    try:
        mapping = json.loads(settings.OAUTH_PROFILE_SCHEMA)
    except AttributeError:
        logger.error("AN OAUTH_PROFILE_SCHEMA was not added to the environment variables.")
        raise
    except ValueError:
        raise Error("An invalid json string was added to OAUTH_PROFILE_SCHEMA, please ensure names and values are "
                     "quoted properly, that quotes are terminated, and that it is surrounded by braces.")
    except TypeError:
        raise Error("AN OAUTH_PROFILE_SCHEMA was added to the environment but it is empty.  Please add a valid mapping.")
    if not mapping:
        raise Error("AN OAUTH_PROFILE_SCHEMA was added to the environment but it an empty json object.  Please add a valid mapping.")
    for key, value in mapping.iteritems():
        user_data[key] = data.get(value)
    return user_data


def request_access_token(auth_code):

    logger.debug('Requesting: code="{0}"'.format(auth_code))
    try:
        response = requests.post(
            settings.OAUTH_TOKEN_URL,
            auth=(settings.OAUTH_CLIENT_ID, settings.OAUTH_CLIENT_SECRET),
            data={
                'grant_type': 'authorization_code',
                'code': auth_code,
                'redirect_uri': settings.OAUTH_REDIRECT_URI,
            },
        )
        logger.debug('Received response: {0}'.format(response.text))
        response.raise_for_status()
    except requests.ConnectionError as err:
        logger.error('Could not reach Token Server: {0}'.format(err))
        raise OAuthServerUnreachable()
    except requests.HTTPError as err:
        status_code = err.response.status_code
        if status_code == 401:
            logger.error('OAuth server rejected user auth code: {0}'.format(err.response.text))
            raise Unauthorized('OAuth server rejected auth code')
        logger.error('OAuth server returned HTTP {0}'.format(status_code), err.response.text)
        raise OAuthError(status_code)

    access = response.json()
    access_token = access.get(settings.OAUTH_TOKEN_KEY)
    if not access_token:
        logger.error('OAuth server response missing `{0}`.  Response Text:\n{1}'.format(settings.OAUTH_TOKEN_KEY, response.text))
        raise InvalidOauthResponse('missing `{0}`'.format(settings.OAUTH_TOKEN_KEY), response.text)
    return access_token


#
# Errors
#

class Error(Exception):
    def __init__(self, message):
        super(Exception, self).__init__(message)


class OAuthServerUnreachable(Error):
    def __init__(self):
        super(Error, self).__init__('OAuth Server is unreachable')


class OAuthError(Error):
    def __init__(self, status_code):
        super(Error, self).__init__('OAuth Server responded with HTTP {0}'.format(status_code))
        self.status_code = status_code


class InvalidOauthResponse(Error):
    def __init__(self, message, response_text):
        super(Error, self).__init__('OAuth Server returned invalid response: {0}'.format(message))
        self.response_text = response_text


class Unauthorized(Error):
    def __init__(self, message):
        super(Error, self).__init__('Unauthorized: {0}'.format(message))