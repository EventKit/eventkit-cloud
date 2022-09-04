# -*- coding: utf-8 -*-

import base64
import json
from functools import wraps
from logging import getLogger
from typing import Union
from urllib.parse import urlencode

from django.conf import settings
from django.contrib.auth import login
from django.contrib.auth import logout as auth_logout
from django.http import HttpResponse, HttpResponsePermanentRedirect, JsonResponse
from django.shortcuts import redirect
from rest_framework.views import APIView

from eventkit_cloud.auth.auth import (
    OAuthError,
    Unauthorized,
    fetch_user_from_token,
    refresh_access_tokens,
    request_access_tokens,
)
from eventkit_cloud.core.helpers import get_id

logger = getLogger(__name__)


def validate_oath_vars():
    oauth_vars = ["OAUTH_CLIENT_ID", "OAUTH_REDIRECT_URI", "OAUTH_RESPONSE_TYPE", "OAUTH_SCOPE"]
    oauth_values = [getattr(settings, _oauth_var) for _oauth_var in oauth_vars]
    if any([_value is None for _value in oauth_values]):
        first_index_of_none = oauth_values.index(None)
        raise Exception(f"OAuth enabled but var '{oauth_vars[first_index_of_none]}' is None.")


def oauth(request, redirect_url=None):
    """
    :return: A redirection to the OAuth server (OAUTH_AUTHORIZATION_URL) provided in the settings
    """
    if getattr(settings, "OAUTH_AUTHORIZATION_URL", None):
        oauth_name = getattr(settings, "OAUTH_NAME")
        if oauth_name is None:
            raise Exception("OAuth enabled but var 'OAUTH_NAME' is None.")
        if request.GET.get("query"):
            return HttpResponse(
                json.dumps({"name": oauth_name}),
                content_type="application/json",
                status=200,
            )
        else:
            validate_oath_vars()
            # TODO: investigate why mypy refuses to recognize settings.OAUTH_CLIENT as an attribute
            # this applies to all of the oauth vars
            params = [
                ("client_id", getattr(settings, "OAUTH_CLIENT_ID")),
                ("redirect_uri", getattr(settings, "OAUTH_REDIRECT_URI")),
                ("response_type", getattr(settings, "OAUTH_RESPONSE_TYPE")),
                ("scope", getattr(settings, "OAUTH_SCOPE")),
            ]
            if redirect_url:
                params += [
                    (
                        "state",
                        base64.b64encode(redirect_url.encode()),
                    )
                ]
            elif request.META.get("HTTP_REFERER"):
                params += [
                    (
                        "state",
                        base64.b64encode(request.META.get("HTTP_REFERER").encode()),
                    )
                ]
            encoded_params = urlencode(params)
            return redirect("{0}?{1}".format(getattr(settings, "OAUTH_AUTHORIZATION_URL").rstrip("/"), encoded_params))
    else:
        return redirect("/login/error")


def callback(request):
    try:
        access_token, refresh_token = request_access_tokens(request.GET.get("code"))
        request.session["access_token"] = access_token
        request.session["refresh_token"] = refresh_token
        user = fetch_user_from_token(access_token)
        state = request.GET.get("state")
        if user:
            login(request, user, backend="django.contrib.auth.backends.ModelBackend")
            logger.info('User "{0}" has logged in successfully'.format(get_id(user)))
            if state:
                return redirect(base64.b64decode(state).decode())
            return redirect("dashboard")
        else:
            logger.error("User could not be logged in.")
            return HttpResponse(
                '{"error":"User could not be logged in"}',
                content_type="application/json",
                status=401,
            )
    except Exception as e:
        # Unless otherwise noted, we want any exception to redirect to the error page.
        logger.error("Exception occurred during oauth, redirecting user.")
        if getattr(settings, "DEBUG"):
            raise e
        return redirect("/login/error")


def logout(request):
    """Log out user

    If user is an Oauth user it will pass back an OAuth redirect to be handled by UI.
    """
    is_oauth = hasattr(request.user, "oauth")
    if request.user.is_authenticated:
        auth_logout(request)
    response: Union[JsonResponse, HttpResponsePermanentRedirect] = redirect("login")
    if getattr(settings, "OAUTH_LOGOUT_URL", None):
        if is_oauth:
            response = JsonResponse({"OAUTH_LOGOUT_URL": getattr(settings, "OAUTH_LOGOUT_URL")})
    if settings.SESSION_USER_LAST_ACTIVE_AT in request.session:
        del request.session[settings.SESSION_USER_LAST_ACTIVE_AT]
    response.delete_cookie(settings.AUTO_LOGOUT_COOKIE_NAME, domain=settings.SESSION_COOKIE_DOMAIN)
    return response


def has_valid_access_token(request) -> bool:
    is_oauth = hasattr(request.user, "oauth")
    if getattr(settings, "OAUTH_AUTHORIZATION_URL", None) and is_oauth:
        if isinstance(request, str):
            access_token = request
        else:
            access_token = request.session.get("access_token")
        if access_token:
            try:
                # This returns a call to get_user which updates the oauth profile.
                fetch_user_from_token(access_token)
                return True
            except (OAuthError, Unauthorized):
                logger.info("Invalid access token, trying to refresh access token.")
                access_token, refresh_token = refresh_access_tokens(request.session.get("refresh_token"))
                request.session["access_token"] = access_token
                request.session["refresh_token"] = refresh_token
                try:
                    fetch_user_from_token(access_token)
                    return True
                except (OAuthError, Unauthorized):
                    return False
        else:
            return False
    else:
        # If OAuth isn't enabled, allow without checking for a valid token.
        return True


def requires_oauth_authentication(func):
    @wraps(func)
    def wrapper(request, *args, **kwargs):
        if issubclass(type(request), APIView):
            # The original request is available on an APIView as request.
            valid_access_token = has_valid_access_token(request.request)
        else:
            valid_access_token = has_valid_access_token(request)

        if valid_access_token:
            return func(request, *args, **kwargs)
        else:
            # Validate with OAuth and then return to the requested URL.
            return oauth(request, redirect_url=request.get_full_path())

    return wrapper
