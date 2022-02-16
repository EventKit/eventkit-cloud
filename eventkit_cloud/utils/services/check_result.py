# -*- coding: utf-8 -*-
import logging
from enum import Enum

from django.utils.translation import ugettext as _

logger = logging.getLogger(__name__)


class CheckResult(Enum):
    """
    Enum describing possible results of the provider check. Returns are in JSON format, with a status field
    containing an error code, and a message field containing more detailed information. Status may be one of:
        TIMEOUT - The connection timed out (requests.get raised ConnectionTimeout)
        CONNECTION - Could not connect to endpoint (requests.get raised a different ConnectionError)
        NOT_FOUND - Server returned status 404; service is unlikely to be available
        SSL_EXCEPTION - Secure connection failed, probably due to a missing or misconfigured client cert/key
        UNAUTHORIZED - Not authorized to connect (response status 401 or 403)
        UNAVAILABLE - Server returned a status other than 200; service may not be available
        UNKNOWN_FORMAT - GetCapabilities returned blank, or unrecognized metadata format
        LAYER_NOT_AVAILABLE - The requested layer wasn't found among those listed by GetCapabilities reply
        NO_INTERSECT - The given AOI doesn't intersect the response's bounding box for the given layer
        NO_URL - No service url was given in the data provider config, so availability couldn't be checked
        UNKNOWN_ERROR - An exception was thrown that wasn't handled by any of the other Exception handlers.
        SUCCESS - No problems: export should proceed without issues
        (NB: for OWS sources in some cases, GetCapabilities may return 200 while GetMap/Coverage/Feature returns 403.
        In these cases, a success case will be falsely reported instead of ERR_UNAUTHORIZED.)
    """

    TIMEOUT = {
        "status": "ERR",
        "type": "TIMEOUT",
        "message": _("Your connection has timed out; the provider may be offline. Refresh to try again."),
    }

    CONNECTION = {
        "status": "ERR",
        "type": "CONNECTION",
        "message": _("A connection to this data provider could not be established."),
    }

    UNAUTHORIZED = {
        "status": "ERR",
        "type": "UNAUTHORIZED",
        "message": _("Authorization is required to connect to this data provider."),
    }

    NOT_FOUND = {
        "status": "ERR",
        "type": "NOT_FOUND",
        "message": _("The data provider was not found on the server (status 404)."),
    }

    SSL_EXCEPTION = {
        "status": "WARN",
        "type": "SSL_EXCEPTION",
        "message": _("Could not connect securely to provider; possibly missing client certificate"),
    }

    UNAVAILABLE = {
        "status": "WARN",
        "type": "UNAVAILABLE",
        "message": _("This data provider may be unavailable (status %(status)s)."),
    }

    UNKNOWN_FORMAT = {
        "status": "WARN",
        "type": "UNKNOWN_FORMAT",
        "message": _(
            "This data provider returned metadata in an unexpected format; "
            "errors may occur when creating the DataPack."
        ),
    }

    LAYER_NOT_AVAILABLE = {
        "status": "WARN",
        "type": "LAYER_NOT_AVAILABLE",
        "message": _("This data provider does not offer the requested layer."),
    }

    NO_INTERSECT = {
        "status": "WARN",
        "type": "NO_INTERSECT",
        "message": _("The selected AOI does not intersect the data provider's layer."),
    }

    NO_URL = {
        "status": "WARN",
        "type": "NO_URL",
        "message": _("No Service URL was found in the data provider config; " "availability cannot be checked"),
    }

    TOO_LARGE = {
        "status": "WARN",
        "type": "SELECTION_TOO_LARGE",
        "message": _("The selected AOI is larger than the maximum allowed size for this data provider."),
    }

    UNKNOWN_ERROR = {
        "status": "ERR",
        "type": "ERROR",
        "message": _("An error has occurred, please contact an administrator."),
    }

    INVALID_CONFIGURATION = {
        "status": "ERR",
        "type": "INVALID_CONFIGURATION",
        "message": _("The data provider configuration is invalid."),
    }

    SUCCESS = {"status": "SUCCESS", "type": "SUCCESS", "message": _("Export should proceed without issues.")}


def get_status_result(check_result: CheckResult, *args, **kwargs):
    """Updates the check_result message with parameters.
    >>> self.get_status_result({"message": "Status ({status})"}, "200")
    {"message": "(200)"}
    """
    status_result = check_result.value
    status_result["message"] = status_result["message"].format(**kwargs)
    return status_result
