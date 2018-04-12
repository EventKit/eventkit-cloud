# -*- coding: utf-8 -*-
"""UI view definitions."""
import json
import re
import math
from django.conf import settings
from django.contrib.auth import logout as auth_logout
from django.core.urlresolvers import reverse
from django.template import RequestContext
from django.shortcuts import redirect, render_to_response
from django.template.context_processors import csrf
from django.views.decorators.http import require_http_methods
from django.http import HttpResponse
from .data_estimator import get_size_estimate
from django.contrib.auth import authenticate, login
from ..api.serializers import UserDataSerializer
from rest_framework.renderers import JSONRenderer
from logging import getLogger
from ..utils.geocode import Geocode
from ..utils.reverse import ReverseGeocode
from ..utils.convert import Convert
from .helpers import file_to_geojson, set_session_user_last_active_at
from datetime import datetime, timedelta
import pytz



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
    if request.method == 'GET' and request.user.is_authenticated():
        # If the user is already authenticated we want to return the user data (required for oauth).
        return HttpResponse(JSONRenderer().render(UserDataSerializer(request.user).data),
                            content_type="application/json",
                            status=200)
    elif getattr(settings, "LDAP_SERVER_URI", getattr(settings, "DJANGO_MODEL_LOGIN")):
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
                set_session_user_last_active_at(request)
                return HttpResponse(JSONRenderer().render(UserDataSerializer(user_data).data),
                                    content_type="application/json",
                                    status=200)
        if request.method == 'GET':
            # We want to return a 200 so that the frontend can decide if the auth endpoint is valid for displaying the
            # the login form.
            return HttpResponse(status=200)
    else:
        return HttpResponse(status=400)

def logout(request):
    """Logs out user"""
    auth_logout(request)
    response = redirect('login')
    if settings.SESSION_USER_LAST_ACTIVE_AT in request.session:
        del request.session[settings.SESSION_USER_LAST_ACTIVE_AT]
    response.delete_cookie(settings.AUTO_LOGOUT_COOKIE_NAME, domain=settings.SESSION_COOKIE_DOMAIN)
    return response


def require_email(request):
    """
    View to handle email collection for new user log in with OSM account.
    """
    backend = request.session['partial_pipeline']['backend']
    return render_to_response('osm/email.html', {'backend': backend}, RequestContext(request))


def is_mgrs_string(query):
    query = re.sub(r"\s+", '', query)
    pattern = re.compile(r"^(\d{1,2})([C-HJ-NP-X])\s*([A-HJ-NP-Z])([A-HJ-NP-V])\s*(\d{1,5}\s*\d{1,5})$", re.I)
    if pattern.match(query):
        return True
    return False


def is_lat_lon(query):
    # regex for matching to lat and lon
    lat_pattern = re.compile(r"^(\+|-)?(?:90(?:(?:\.0{1,20})?)|(?:[0-9]|[1-8][0-9])(?:(?:\.[0-9]{1,20})?))$")
    lon_pattern = re.compile(r"^(\+|-)?(?:180(?:(?:\.0{1,20})?)|(?:[0-9]|[1-9][0-9]|1[0-7][0-9])(?:(?:\.[0-9]{1,20})?))$")

    parsed_coord_array = []

    # initial separation of numbers
    coord_array = query.split(',') if query.find(',') != -1 else query.split(' ')
    if len(coord_array) != 2:
        return False

    parsed_lat = None
    parsed_lon = None
    try:
        parsed_lat = float(coord_array[0])
        parsed_lon = float(coord_array[1])
    except ValueError as e:
        return False

    if not math.isnan(parsed_lat) and not math.isnan(parsed_lon):
        parsed_coord_array = [
            parsed_lat,
            parsed_lon
        ]

    if lat_pattern.match(str(parsed_lat)) and lon_pattern.match(str(parsed_lon)):
        return parsed_coord_array

    return False


@require_http_methods(['GET'])
def search(request):
    q = request.GET.get('query', None)
    if not q:
        return HttpResponse("where is your query dingus")

    degree_range = 0.05
    if is_mgrs_string(q):
        # check for necessary settings
        if getattr(settings, 'CONVERT_API_URL') is None:
            return HttpResponse('No Convert API specified', status=501)

        if getattr(settings, 'REVERSE_GEOCODING_API_URL') is None:
            return HttpResponse('No Reverse Geocode API specified', status=501)

        # make call to convert then do reverse geocode
        convert = Convert()
        mgrs_data = convert.get(q)
        if mgrs_data.get('geometry'):
            features = []
            mgrs_data.get('properties')['bbox'] = [
                mgrs_data.get('geometry').get('coordinates')[0] - degree_range,
                mgrs_data.get('geometry').get('coordinates')[1] - degree_range,
                mgrs_data.get('geometry').get('coordinates')[0] + degree_range,
                mgrs_data.get('geometry').get('coordinates')[1] + degree_range,
            ]
            mgrs_data['source'] = 'MGRS'
            features.append(mgrs_data)

            reverse = ReverseGeocode()
            result = reverse.search({
                "point.lat": mgrs_data.get('geometry').get('coordinates')[1],
                "point.lon": mgrs_data.get('geometry').get('coordinates')[0]
            })
            if result.get('features'):
                # add the mgrs feature with the search results and return together
                result['features'] = features + result['features']
                return HttpResponse(content=json.dumps(result), status=200, content_type="application/json")

        return HttpResponse("Could not get the query results", status=204, content_type="application/json")

    elif is_lat_lon(q):
        coords = is_lat_lon(q)
        # make call to reverse geocode
        if getattr(settings, 'REVERSE_GEOCODING_API_URL') is None:
            return HttpResponse('No Reverse Geocode API specified', status=501)

        reverse = ReverseGeocode()

        result = reverse.search({
            "point.lat": coords[0],
            "point.lon": coords[1]
        })

        point_feature = {
            "geometry": {
                "type": "Point",
                "coordinates": [coords[1], coords[0]]
            },
            "source": "Coordinate",
            "type": "Feature",
            "properties": {
                "name": "Your searched coord",
                "bbox": [
                    coords[1] - degree_range,
                    coords[0] - degree_range,
                    coords[1] + degree_range,
                    coords[0] + degree_range
                ]
            }
        }

        if result.get('features'):
            result.get('features').insert(0, point_feature)
            return HttpResponse(content=json.dumps(result), status=200, content_type="application/json")

        features = {'features': [point_feature]}
        return HttpResponse(content=json.dumps(features), status=200, content_type="application/json")
    else:
        # make call to geocode with search
        geocode = Geocode()
        result = geocode.search(q)
        return HttpResponse(content=json.dumps(result), status=200, content_type="application/json")

@require_http_methods(['GET'])
def geocode(request):
    geocode = Geocode()
    if request.GET.get('search'):
        result = geocode.search(request.GET.get('search'))
        return HttpResponse(content=json.dumps(result), status=200, content_type="application/json")
    if request.GET.get('result'):
        result = geocode.add_bbox(json.loads(request.GET.get('result')))
        return HttpResponse(content=json.dumps(result), status=200, content_type="application/json")
    else:
        return HttpResponse(status=204, content_type="application/json")


@require_http_methods(['GET'])
def convert(request):
    convert = Convert()
    if getattr(settings, 'CONVERT_API_URL') is not None:
        if request.GET.get('convert'):
            result = convert.get(request.GET.get('convert'))
            return HttpResponse(content=json.dumps(result), status=200, content_type="application/json")
        else:
            return HttpResponse(status=204, content_type="application/json")
    else:
        return HttpResponse('No Convert API specified', status=501)


@require_http_methods(['GET'])
def reverse_geocode(request):
    reverseGeocode = ReverseGeocode()
    if getattr(settings, 'REVERSE_GEOCODING_API_URL') is not None:
        if request.GET.get('lat') and request.GET.get('lon'):
            result = reverseGeocode.search({"point.lat": request.GET.get('lat'), "point.lon": request.GET.get('lon')})
            return HttpResponse(content=json.dumps(result), status=200, content_type="application/json")
        if request.GET.get('result'):
            result = reverseGeocode.add_bbox(json.loads(request.GET.get('result')))
            return HttpResponse(content=json.dumps(result), status=200, content_type="application/json")
        else:
            return HttpResponse(status=204, content_type="application/json")
    else:
        return HttpResponse('No Reverse Geocode API specified', status=501)


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

@require_http_methods(['GET'])
def get_config(request):
    """
    :param request: a GET request
    :return: a dict of available configurations
    """
    config = getattr(settings, 'UI_CONFIG', {})
    return HttpResponse(json.dumps(config), status=200)


@require_http_methods(['POST'])
def convert_to_geojson(request):
    file = request.FILES.get('file', None)
    if not file:
        return HttpResponse('No file supplied in the POST request', status=400)
    try:
        geojson = file_to_geojson(file)
        return HttpResponse(json.dumps(geojson), content_type="application/json", status=200)
    except Exception as e:
        logger.error(e)
        return HttpResponse(e.message, status=400)


def user_active(request):
    """Prevents auto logout by updating the session's last active time"""
    # If auto logout is disabled, just return an empty body.
    if not settings.AUTO_LOGOUT_SECONDS:
        return HttpResponse(json.dumps({}), content_type='application/json', status=200)

    last_active_at = set_session_user_last_active_at(request)
    auto_logout_at = last_active_at + timedelta(seconds=settings.AUTO_LOGOUT_SECONDS)
    auto_logout_warning_at = auto_logout_at - timedelta(seconds=settings.AUTO_LOGOUT_WARNING_AT_SECONDS_LEFT)
    return HttpResponse(json.dumps({
        'auto_logout_at': auto_logout_at.isoformat(),
        'auto_logout_warning_at': auto_logout_warning_at.isoformat(),
    }), content_type='application/json', status=200)


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
