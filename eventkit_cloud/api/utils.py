import logging
from collections import OrderedDict
from datetime import date, datetime, timedelta
from functools import reduce
from typing import Optional, Union, List, Dict, Any

import rest_framework.status
from audit_logging.models import AuditEvent
from django.conf import settings
from django.contrib.auth.models import User
from django.db.models import Count, QuerySet, OuterRef, Subquery
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import exception_handler

from eventkit_cloud.jobs.models import Region
from eventkit_cloud.tasks.models import RunZipFile, UserDownload

logger = logging.getLogger(__name__)


def eventkit_exception_handler(exc, context):
    """
    Example Response
    {
        "errors": [
            {
                "status": "422",
                "title": "Invalid Attribute",
                "detail": "First name must contain at least three characters.",
                "type": "ValidationError"
            }
        ]
    }
    """
    # Call REST framework's default exception handler first,
    # to get the standard error response. Parse the response accordingly.
    if getattr(settings, "DEBUG"):
        raise exc
    response = exception_handler(exc, context)
    if response:

        error = response.data
        status = response.status_code
        error_class = exc.__class__.__name__

        if hasattr(exc, "detail"):
            detail = exc.detail
        else:
            detail = error

        # If get_codes returns a dict, grab the values and turn them into a string for the title.
        if hasattr(exc, "get_codes"):
            code = exc.get_codes()
            title = ""
            if isinstance(code, dict):
                for key, value in code.items():
                    title += stringify(value)
            else:
                title = code
        else:
            title = error_class

        error_response = {"status": status, "title": stringify(title), "detail": str(detail), "type": error_class}
        if isinstance(error, dict) and error.get("id") and error.get("message"):
            # if both id and message are present we can assume that this error was generated from validators.py
            # and use them as the title and detail
            error_response["title"] = stringify(error.get("id"))
            error_response["detail"] = stringify(error.get("message"))

        elif isinstance(exc, ValidationError):
            # if the error is a ValidationError type and not from validators.py we need to get rid of the wonky format.
            # Error might looks like this: {'name': [u'Ensure this field has no more than 100 characters.']}
            # it should look like this: 'name: Ensure this field has no more than 100 characters.'
            detail = ""
            if isinstance(error, dict):
                if error.get("provider_tasks"):
                    # provider tasks errors have some extra nesting that needs to be handled
                    detail = parse_provider_tasks(error)
                else:
                    for key, value in error.items():
                        detail += "{0}: {1}\n".format(key, stringify(value))
                detail = detail.rstrip("\n")
            else:
                detail = stringify(error)

            error_response["detail"] = detail

        error_response["title"] = error_response["title"].title().replace("_", " ")
        response.data = {"errors": [error_response]}
    # exception_handler doesn't handle generic exceptions, so we need to handle that here.
    else:
        response_status = rest_framework.status.HTTP_500_INTERNAL_SERVER_ERROR
        response = Response(
            {"errors": {"status": response_status, "title": str(exc.__class__.__name__), "detail": str(exc)}},
            status=response_status,
        )
    return response


def parse_provider_tasks(error):
    """
    Parse out provider tasks depending on what kind of object it is and isolate the message about a specific form
    field if necessary.
    :param error:
    :return:
    """
    if error.get("provider_tasks"):
        if isinstance(error.get("provider_tasks")[0], dict):
            return stringify(list(error.get("provider_tasks")[0].values())[0])
        else:
            return error.get("provider_tasks")[0]
    else:
        return error.get("provider_tasks")


def stringify(item):
    """
    Take an array and makes it a string (or just returns string).
    :param item:
    :return:
    """
    if hasattr(item, "__iter__") and len(item) > 1:
        logger.error("Exceptions should have a title and description per message not multiple.")
        logger.error("Exception: {0}".format(str(item)))
    if isinstance(item, dict):
        return "{0}: {1}".get(next(iter(item.items())))
    elif isinstance(item, list):
        return "{0}".format(item[0])
    elif isinstance(item, str):
        return item
    elif isinstance(item, int):
        return str(item)
    elif item is None:
        return ""
    else:
        raise Exception("Stringify doesn't support items of type {0}".format(type(item)))


def get_run_zip_file(field=None, values=[]):
    """
    :param field: The field you want to filter on.
    :param values: The values you want to filter for.
    :return: A queryset with the selected run_zip_file.
    """
    initial_qs = RunZipFile.objects.annotate(cnt=Count("data_provider_task_records")).filter(cnt=len(values))

    if field:
        field = f"__{field}"
    else:
        field = ""

    queryset = reduce(lambda qs, value: qs.filter(**{f"data_provider_task_records{field}": value}), values, initial_qs)

    return queryset.select_related("downloadable_file")


def get_binned_groups(users: dict, user_group_bins: List[str]):

    groups = OrderedDict()

    # Bin the users by groups and aggregate login counts.
    for user_data in users.values():
        user = user_data.get("user")
        if not hasattr(user, "oauth"):
            logger.debug(f"User {user.username} does not have oauth information")
        elif user_group_bins is None:
            logger.debug("No user groups specified, specify user groups with `?user_group=groupName`")
        else:
            user_info = user.oauth.user_info
            user_group_key = repr(tuple([user_info.get(user_group_param) for user_group_param in user_group_bins]))
            if not groups.get(user_group_key):
                groups[user_group_key] = {"users": [], "logins": 0}
            groups[user_group_key]["users"] = groups[user_group_key]["users"] + [user.username]
            groups[user_group_key]["logins"] = groups[user_group_key]["logins"] + sum(user_data["logins"].values())

    group_order = sorted(groups, key=lambda x: (groups[x]["logins"]))
    sorted_groups = {group_name: groups[group_name] for group_name in group_order}
    return sorted_groups


def get_download_counts_by_area(
    region_filter: Dict[str, Any],
    users: Union[QuerySet, List[User]] = None,
    count: int = None,
    start_date: Optional[Union[date, datetime]] = None,
):

    region_filter = region_filter or dict()
    query = dict()
    if users:
        query["user__in"] = users
    if start_date:
        query["downloaded_at__gte"] = start_date

    query["downloadable__export_task__export_provider_task__run__job__the_geom__intersects"] = OuterRef("the_geom")
    download_subquery = UserDownload.objects.filter(**query).values("uid")

    regions = (
        Region.objects.filter(**region_filter)
        .annotate(downloads=Count(Subquery(download_subquery)))
        .order_by("-downloads")[:count]
    )

    return {region.name: region.downloads for region in regions}


def get_logins_per_day(users: List[User], events: List[AuditEvent]):
    user_cache = {user.username: {"user": user, "logins": dict()} for user in users}
    # Could filter again by date, but here its probably faster to just
    # loop the dates instead of querying the DB again.
    for event in events:
        date = event.datetime.date()
        user_cache[event.username]["logins"][date] = user_cache.get(date, 0) + 1
    return user_cache
