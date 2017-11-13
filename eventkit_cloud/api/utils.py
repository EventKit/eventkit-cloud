from rest_framework.views import exception_handler
from rest_framework.exceptions import ValidationError
import logging

logger = logging.getLogger(__name__)


def eventkit_exception_handler(exc, context):
    """
    Example Response
    {
        "errors": [
            {
                "status": "422",
                "source": {"pointer": "/data/attributes/first-name"},
                "title": "Invalid Attribute",
                "detail": "First name must contain at least three characters."
            }
        ]
    }
    """
    # Call REST framework's default exception handler first,
    # to get the standard error response. Parse the response accordingly.
    response = exception_handler(exc, context)
    error = response.data
    status = response.status_code
    error_class = exc.__class__.__name__

    error_response = {
        'status': status,
        'title': error_class,
        'detail': error
    }

    if (error.get('id')) and (error.get('message')):
        # if both id and message are present we can assume that this error was generated from validators.py
        # and use them as the title and detail
        error_response['title'] = stringify(error.get('id'))
        error_response['detail'] = stringify(error.get('message'))

    elif isinstance(exc, ValidationError):
        # if the error is a ValidationError type and not from validators.py we need to get rid of the wonky format.
        # Error might looks like this: {'name': [u'Ensure this field has no more than 100 characters.']}
        # it should look like this: 'name: Ensure this field has no more than 100 characters.'
        detail = ''
        if isinstance(error, dict):
            if error.get('provider_tasks'):
                # provider tasks errors have some extra nesting that needs to be handled
                detail = parse_provider_tasks(error)
            else:
                for key, value in error.iteritems():
                    detail += '{0}: {1}\n'.format(key, stringify(value))
            detail = detail.rstrip('\n')
        else:
            detail = stringify(error)

        error_response['detail'] = detail

    response.data = {'errors':[error_response]}
    return response


def parse_provider_tasks(error):
    """
    Parse out provider tasks depending on what kind of object it is and isolate the message about a specific form field if necessary.
    :param error:
    :return:
    """
    if error.get('provider_tasks'):
        if isinstance(error.get('provider_tasks')[0], dict):
            return stringify(error.get('provider_tasks')[0].values()[0])
        else:
            return error.get('provider_tasks')[0]
    else:
        return error.get('provider_tasks')


def stringify(item):
    """
    Take an array and makes it a string (or just returns string).
    :param item:
    :return:
    """
    if hasattr(item, '__iter__') and len(item) > 1:
        logger.error("Exceptions should have a title and description per message not multiple.")
        logger.error("Exception: {0}".format(str(item)))
    if isinstance(item, dict):
        return "{0}: {1}".get(item.iteritems().next())
    elif isinstance(item, list):
        return "{0}".format(item[0])
    elif isinstance(item, str):
        return item
    elif item is None:
        return ""
    else:
        raise Exception("Stringify doesn't support items of type {0}".format(type(item)))
