from rest_framework.views import exception_handler
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
    error_response = {'status': response.status_code,
                      'title': error.get('title') or stringify(error.get('id')) or stringify(error.get('description')),
                      'detail': error.get('detail') or stringify(error.get('message')) or parseProviderTasks(error)}
    # Parse title if not already defined.
    # Define it as the title of the erroneous form field if such data is present.
    if not error_response.get('title'):
        if error.get('provider_tasks'):
            error_response['title'] = error.get('provider_tasks')[0].keys()[0];
        else:
            error_response['title'] = "Improperly formatted JSON"
    response.data = {'errors':[error_response]}
    return response


def parseProviderTasks(error):
    """
    Parse out provider tasks depending on what kind of object it is and isolate the message about a specific form field if necessary.
    :param error:
    :return:
    """
    if error.get('provider_tasks'):
        if isinstance(error.get('provider_tasks')[0], dict):
            return stringify(error.get('provider_tasks')[0].values()[0]);
        else:
            return error.get('provider_tasks')[0]
    else:
        return error.get('provider_tasks');

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
