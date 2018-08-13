# -*- coding: utf-8 -*-

import json
import urllib
from logging import getLogger

from django.conf import settings
from django.contrib.auth import login
from django.contrib.auth import logout as auth_logout
from django.http import HttpResponse, JsonResponse
from django.shortcuts import redirect

from eventkit_cloud.auth.auth import request_access_token, fetch_user_from_token
from eventkit_cloud.core.helpers import get_id

logger = getLogger(__name__)


def oauth(request):
    """
    :return: A redirection to the OAuth server (OAUTH_AUTHORIZATION_URL) provided in the settings 
    """
    if getattr(settings, "OAUTH_AUTHORIZATION_URL", None):
        if request.GET.get('query'):
            return HttpResponse(json.dumps({'name': settings.OAUTH_NAME}),
                                content_type="application/json",
                                status=200)
        else:
            params = urllib.urlencode((
                ('client_id', settings.OAUTH_CLIENT_ID),
                ('redirect_uri', settings.OAUTH_REDIRECT_URI),
                ('response_type', settings.OAUTH_RESPONSE_TYPE),
                ('scope', settings.OAUTH_SCOPE),
            ))
            return redirect('{0}?{1}'.format(settings.OAUTH_AUTHORIZATION_URL.rstrip('/'), params))
    else:
        return HttpResponse(status=400)


def callback(request):
    access_token = request_access_token(request.GET.get('code'))
    user = fetch_user_from_token(access_token)
    if user:
        login(request, user, backend='django.contrib.auth.backends.ModelBackend')
        logger.info('User "{0}" has logged in successfully'.format(get_id(user)))
        return redirect('dashboard')
    else:
        logger.error('User could not be logged in.')
        return HttpResponse('{"error":"User could not be logged in"}',
                            content_type="application/json",
                            status=401)


def logout(request):
    """Log out user

        If user is an Oauth user it will pass back an OAuth redirect to be handled by UI.
    """
    is_oauth = hasattr(request.user, 'oauth')
    auth_logout(request)
    response = redirect('login')
    if getattr(settings, "OAUTH_LOGOUT_URL", None):
        if is_oauth:
            response = JsonResponse({'OAUTH_LOGOUT_URL': settings.OAUTH_LOGOUT_URL})
    if settings.SESSION_USER_LAST_ACTIVE_AT in request.session:
        del request.session[settings.SESSION_USER_LAST_ACTIVE_AT]
    response.delete_cookie(settings.AUTO_LOGOUT_COOKIE_NAME, domain=settings.SESSION_COOKIE_DOMAIN)

    return response
