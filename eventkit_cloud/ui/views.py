# -*- coding: utf-8 -*-
"""UI view definitions."""
import json
from django.conf import settings
from django.contrib.auth import logout as auth_logout
from django.core.urlresolvers import reverse
from django.template import RequestContext
from django.shortcuts import redirect, render_to_response
from django.template.context_processors import csrf
from django.views.decorators.http import require_http_methods
from django.http import HttpResponse
from .data_estimator import get_size_estimate
import requests
from django.contrib.auth import authenticate, login
from ..api.serializers import UserDataSerializer
from rest_framework.renderers import JSONRenderer
from logging import getLogger

logger = getLogger(__file__)


@require_http_methods(['GET'])
def create_export(request):
    """
    Handles display of the create export page.
    """
    user = request.user
    max_extent = {'extent': settings.JOB_MAX_EXTENT}
    for group in user.groups.all():
        if hasattr(group, 'export_profile'):
            max_extent['extent'] = group.export_profile.max_extent
    extent = max_extent.get('extent')
    context = {'user': user, 'max_extent': extent}
    context.update(csrf(request))
    return render_to_response('ui/create.html', context, RequestContext(request))


# @user_verification_required
@require_http_methods(['GET'])
def clone_export(request, uuid=None):
    """
    Handles display of the clone export page.
    """
    max_extent = {'extent': settings.JOB_MAX_EXTENT}  # default
    user = request.user
    for group in user.groups.all():
        if hasattr(group, 'export_profile'):
            max_extent['extent'] = group.export_profile.max_extent
    extent = max_extent.get('extent')
    context = {'user': user, 'max_extent': extent}
    context.update(csrf(request))
    return render_to_response('ui/clone.html', context, RequestContext(request))


# @user_verification_required
@require_http_methods(['GET'])
def view_export(request, uuid=None):  # NOQA
    """
    Handles display of the clone export page.
    """
    user = request.user
    context = {'user': user}
    return render_to_response('ui/detail.html', context, RequestContext(request))


def auth(request):
    if getattr(settings, "LDAP_SERVER_URI", getattr(settings, "DJANGO_MODEL_LOGIN")):
        if request.method == 'POST':
            """Logs out user"""
            auth_logout(request)
            username = request.POST.get('username')
            password = request.POST.get('password')
            user_data = authenticate(username=username, password=password)
            if user_data is None:
                return HttpResponse(status=401)
            else:
                login(request, user_data)
                return HttpResponse(JSONRenderer().render(UserDataSerializer(user_data).data),
                                    content_type="application/json",
                                    status=200)
        if request.method == 'GET':
            # We want to return a 200 so that the frontend can decide if the auth endpoint is valid for displaying the
            # the login form.
            if request.user.is_authenticated():
                return HttpResponse(JSONRenderer().render(UserDataSerializer(request.user).data),
                                    content_type="application/json",
                                    status=200)
            else:
                return HttpResponse(status=200)
    else:
        return HttpResponse(status=400)

def logout(request):
    """Logs out user"""
    auth_logout(request)
    return redirect('login')


def require_email(request):
    """
    View to handle email collection for new user log in with OSM account.
    """
    backend = request.session['partial_pipeline']['backend']
    return render_to_response('osm/email.html', {'backend': backend}, RequestContext(request))


@require_http_methods(['GET'])
def request_geonames(request):
    payload = {'maxRows': 20, 'username': 'eventkit', 'style': 'full', 'q': request.GET.get('q')}
    geonames_url = getattr(settings, 'GEONAMES_API_URL')
    if geonames_url:
        response = requests.get(geonames_url, params=payload).json()
        assert(isinstance(response, dict))
        return HttpResponse(content=json.dumps(response), status=200, content_type="application/json")
    else:
        return HttpResponse(content=json.dumps({'error': 'A url was not provided for geonames'}),
                            status=500, content_type="application/json")


@require_http_methods(['GET'])
def about(request):
    exports_url = reverse('list')
    help_url = reverse('help')
    return render_to_response(
        'ui/about.html',
        {'exports_url': exports_url, 'help_url': help_url},
        RequestContext(request)
    )


@require_http_methods(['GET'])
def help_main(request):
    return render_to_response('help/help.html', {}, RequestContext(request))


@require_http_methods(['GET'])
def help_create(request):
    create_url = reverse('create')
    help_features_url = reverse('help_features')
    return render_to_response(
        'help/help_create.html',
        {'create_url': create_url, 'help_features_url': help_features_url},
        RequestContext(request)
    )


@require_http_methods(['GET'])
def help_features(request):
    return render_to_response(
        'help/help_features.html', {}, RequestContext(request)
    )


@require_http_methods(['GET'])
def help_exports(request):
    export_url = reverse('list')
    return render_to_response(
        'help/help_exports.html', {'export_url': export_url}, RequestContext(request)
    )


@require_http_methods(['GET'])
def help_formats(request):
    return render_to_response(
        'help/help_formats.html', {}, RequestContext(request)
    )


@require_http_methods(['GET'])
def help_presets(request):
    configurations_url = reverse('configurations')
    return render_to_response(
        'help/help_presets.html',
        {'configurations_url': configurations_url},
        RequestContext(request)
    )


@require_http_methods(['POST'])
def data_estimator(request):
    """

    :param request: Example {'providers': ['ESRI-Imagery'], 'bbox': [-43.238239, -22.933733, -43.174725, -22.892623]}
    :return: HttpResponse, with the size.
    """
    request_data = json.loads(request.body)
    size = 0
    providers = request_data.get('providers')
    bbox = request_data.get('bbox')
    if not providers and not bbox:
        return HttpResponse("Providers or BBOX were not supplied in the request", status=400)

    for provider in providers:
        estimates = get_size_estimate(provider, bbox)
        size += estimates[1]
    return HttpResponse([size], status=200)


# error views


@require_http_methods(['GET'])
def create_error_view(request):
    return render_to_response('ui/error.html', {}, RequestContext(request), status=500)


def internal_error_view(request):
    return render_to_response('ui/500.html', {}, RequestContext(request), status=500)


def not_found_error_view(request):
    return render_to_response('ui/404.html', {}, RequestContext(request), status=404)


def not_allowed_error_view(request):
    return render_to_response('ui/403.html', {}, RequestContext(request), status=403)

