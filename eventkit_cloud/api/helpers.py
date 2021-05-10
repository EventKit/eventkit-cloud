import json
import logging
import requests

from django.core.cache import cache

from eventkit_cloud.auth.views import has_valid_access_token
from eventkit_cloud.tasks.export_tasks import load_provider_config
from eventkit_cloud.tasks.helpers import get_or_update_session
from eventkit_cloud.utils import auth_requests

logger = logging.getLogger(__name__)

PROCESS_CACHE_TIMEOUT = 600


def get_session(request, provider):
    session_token = request.session.get("access_token")
    valid_token = has_valid_access_token(session_token)
    config = load_provider_config(provider.config)
    ogc_process_config = config.get("ogcapi_process", dict())
    source_config = ogc_process_config.get("download_credentials", dict(user_var=None, pass_var=None, cert_info=None))
    username = source_config.get("user_var")
    password = source_config.get("pass_var")
    cert_info = source_config.get("cert_info")

    auth_session = None
    if valid_token:
        auth_session = auth_requests.AuthSession().session
        auth_session.headers.update({"Authorization": f"Bearer: {session_token}"})
    return get_or_update_session(
        username=username,
        password=password,
        session=auth_session,
        cert_info=cert_info
    )


def get_process(provider, session):
    config = load_provider_config(provider.config)
    service_url = provider.url
    service_url = service_url.rstrip("/\\")
    service_url += "/"
    
    process = config.get("ogcapi_process").get("process")
    cache_key = f"{process}-cache"
    process_json = cache.get(cache_key, None)
    if process_json is None:
        try:
            response = session.get(
                f"{service_url}processes/{process}",
                stream=True,
            )
            response.raise_for_status()
            process_json = json.loads(response.content)
            cache.set(cache_key, process_json, PROCESS_CACHE_TIMEOUT)
        except requests.exceptions.RequestException as e:
            logger.error(f"Could not access OGC Process:{e}")

    return process_json


def get_process_formats_from_json(process_json):
    """Extract format information from a valid JSON object representing an OGC Process."""
    inputs = process_json.get("inputs", list())
    formats = list(filter(
        lambda input: input.get("id", None) == "file_format",
        inputs)
    )[0].get("input").get("literalDataDomains")[0].get("valueDefinition").get("valuesDescription", dict()).values()
    return [dict(
        slug=_format.get("value"),
        **_format,
    ) for _format in formats]


def get_process_formats(provider, request):
    """Retrieve formats for a given provider if it is an ogc-process type."""
    process_formats = []
    if provider.export_provider_type.type_name == "ogc-process":
        auth_session = get_session(request, provider)
        process_json = get_process(provider, auth_session)
        if process_json:
            process_formats = get_process_formats_from_json(process_json)
    return process_formats
